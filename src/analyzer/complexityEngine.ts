import * as ts from 'typescript';
import { LoopAnalyzer, LoopComplexityInfo, multiplyBigO, maxBigO } from './loopAnalyzer';
import { RecursionAnalyzer } from './recursionAnalyzer';
import { SpaceAnalyzer } from './spaceAnalyzer';
import { UniversalParserRouter, normalizeLanguageId } from './universal/universalParserRouter';
import { UniversalFunctionNode, UniversalLoopNode } from './universal/types';
import { getMessages } from '../i18n';
import { Messages } from '../i18n/messages';
import {
  BigOComplexity,
  FileAnalysisResult,
  FunctionComplexityReport,
  LineAnnotation,
  ReasoningStep,
} from './types';

export class ComplexityEngine {
  private router = new UniversalParserRouter();

  public analyzeCode(
    code: string,
    filePath: string = 'file.ts',
    languageId: string = 'typescript',
    locale: string = 'en'
  ): FileAnalysisResult {
    const normLang = normalizeLanguageId(languageId, filePath);
    const messages = getMessages(locale);

    if (normLang === 'python' || normLang === 'ruby' || normLang === 'cpp' || normLang === 'c') {
      return this.analyzeUniversalCode(code, filePath, normLang, messages);
    }

    const sourceFile = ts.createSourceFile(filePath, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const functions: FunctionComplexityReport[] = [];

    const loopAnalyzer = new LoopAnalyzer(sourceFile, messages);
    const recursionAnalyzer = new RecursionAnalyzer(sourceFile, messages);
    const spaceAnalyzer = new SpaceAnalyzer(sourceFile, messages);

    const visitor = (node: ts.Node) => {
      if (
        ts.isFunctionDeclaration(node) ||
        ts.isFunctionExpression(node) ||
        ts.isArrowFunction(node) ||
        ts.isMethodDeclaration(node)
      ) {
        const report = this.analyzeSingleFunction(
          node,
          sourceFile,
          loopAnalyzer,
          recursionAnalyzer,
          spaceAnalyzer,
          messages
        );
        functions.push(report);
      }
      ts.forEachChild(node, visitor);
    };

    visitor(sourceFile);

    return {
      filePath,
      functions,
    };
  }

  private analyzeUniversalCode(
    code: string,
    filePath: string,
    languageId: string,
    messages: Messages
  ): FileAnalysisResult {
    const universalFile = this.router.parse(code, languageId, filePath, messages);
    const functions: FunctionComplexityReport[] = [];

    for (const uFn of universalFile.functions) {
      functions.push(this.analyzeUniversalFunction(uFn, messages));
    }

    return {
      filePath,
      functions,
    };
  }

  private analyzeUniversalFunction(uFn: UniversalFunctionNode, messages: Messages): FunctionComplexityReport {
    const annotations: LineAnnotation[] = [];
    const reasoningSteps: ReasoningStep[] = [];

    let totalLoopComplexity: BigOComplexity = 'O(1)';
    for (const loop of uFn.loops) {
      const loopCost = this.calculateUniversalLoopCost(loop, annotations, reasoningSteps, messages);
      totalLoopComplexity = maxBigO(totalLoopComplexity, loopCost);
    }

    let isRecursive = uFn.recursiveCalls.length > 0;
    let recursionComplexity: BigOComplexity = 'O(1)';

    if (isRecursive) {
      const callCount = uFn.recursiveCalls.length;
      const isCallInsideLoop = uFn.recursiveCalls.some((call) =>
        uFn.loops.some((loop) => call.line >= loop.line)
      );

      if (callCount === 1) {
        if (uFn.hasDivisionInBody) {
          recursionComplexity = 'O(log n)';
        } else if (isCallInsideLoop && (totalLoopComplexity === 'O(n)' || totalLoopComplexity === 'O(n^2)' || uFn.loops.length > 0)) {
          recursionComplexity = 'O(n!)';
        } else if (totalLoopComplexity === 'O(n)') {
          recursionComplexity = 'O(n^2)';
        } else if (totalLoopComplexity === 'O(n^2)') {
          recursionComplexity = 'O(n^3)';
        } else {
          recursionComplexity = 'O(n)';
        }
      } else if (callCount >= 2) {
        if (uFn.hasDivisionInBody) {
          recursionComplexity = totalLoopComplexity === 'O(n)' ? 'O(n log n)' : 'O(n)';
        } else if (totalLoopComplexity === 'O(n)' || totalLoopComplexity === 'O(n^2)' || uFn.loops.length > 0) {
          recursionComplexity = 'O(n!)';
        } else {
          recursionComplexity = 'O(2^n)';
        }
      }

      reasoningSteps.push({
        type: 'recursion',
        title: messages.recursionTitleNamed(uFn.name),
        detail: messages.recursionDetailNamed(callCount, uFn.name, recursionComplexity === 'O(n!)'),
        complexity: recursionComplexity,
      });

      annotations.push({
        line: uFn.startLine,
        cost: recursionComplexity,
        label: messages.recursionLabel(recursionComplexity),
        explanation: messages.recursionCallExplanation(uFn.name),
      });
    }

    const permRegex = /\b(itertools\.)?permutations\b|\b(std::)?next_permutation\b|\b(std::)?prev_permutation\b|\.permutation\b/i;
    let hasPermutationsCall = permRegex.test(uFn.bodyText);
    let permComplexity: BigOComplexity = hasPermutationsCall ? 'O(n!)' : 'O(1)';

    if (hasPermutationsCall) {
      reasoningSteps.push({
        type: 'summary',
        title: messages.permutationTitle,
        detail: messages.permutationDetail,
        complexity: 'O(n!)',
      });

      annotations.push({
        line: uFn.startLine,
        cost: 'O(n!)',
        label: messages.permutationLabel,
        explanation: messages.permutationExplanation,
      });
    }

    let finalTimeComplexity: BigOComplexity = maxBigO(
      maxBigO(totalLoopComplexity, recursionComplexity),
      permComplexity
    );

    let spaceComplexity: BigOComplexity = 'O(1)';
    let spaceDetail = messages.spaceConstant;
    if (isRecursive) {
      spaceComplexity = uFn.hasDivisionInBody ? 'O(log n)' : 'O(n)';
      spaceDetail = messages.spaceStackDetail(spaceComplexity);
    } else if (hasPermutationsCall) {
      spaceComplexity = 'O(n)';
      spaceDetail = messages.spacePermutationDetail;
    }

    reasoningSteps.push({
      type: 'space',
      title: messages.spaceTitle,
      detail: spaceDetail,
      complexity: spaceComplexity,
    });

    reasoningSteps.push({
      type: 'summary',
      title: messages.summaryFinalResult,
      detail: messages.summaryTimeSpace(finalTimeComplexity, spaceComplexity),
      complexity: finalTimeComplexity,
    });

    annotations.sort((a, b) => a.line - b.line);

    return {
      functionName: uFn.name,
      startLine: uFn.startLine,
      endLine: uFn.endLine,
      timeComplexity: finalTimeComplexity,
      spaceComplexity,
      annotations,
      reasoningSteps,
      isRecursive,
    };
  }

  private calculateUniversalLoopCost(
    loop: UniversalLoopNode,
    annotations: LineAnnotation[],
    reasoningSteps: ReasoningStep[],
    messages: Messages,
    depth: number = 1
  ): BigOComplexity {
    const loopCost: BigOComplexity = loop.stepType === 'logarithmic' ? 'O(log n)' : loop.stepType === 'sqrt' ? 'O(sqrt n)' : 'O(n)';
    const depthLabel = depth === 1 ? messages.outerLoop : depth === 2 ? messages.innerLoop : messages.loopLevel(depth);

    let subMax: BigOComplexity = 'O(1)';
    for (const sub of loop.subLoops) {
      const c = this.calculateUniversalLoopCost(sub, annotations, reasoningSteps, messages, depth + 1);
      subMax = maxBigO(subMax, c);
    }

    const combined = multiplyBigO(loopCost, subMax);

    annotations.push({
      line: loop.line,
      cost: combined,
      label: `← ${depthLabel}: ${combined}`,
      explanation: loop.explanation + (combined !== loopCost ? messages.nestedLoopsWithInner(combined) : ''),
    });

    reasoningSteps.push({
      type: 'loop',
      title: `${depthLabel} (${messages.location} ${loop.line})`,
      detail: `${loop.explanation}${combined !== loopCost ? messages.nestedLoopsWithInner(combined) : ''}`,
      complexity: combined,
    });

    if (depth === 1 && combined !== loopCost) {
      reasoningSteps.push({
        type: 'loop',
        title: messages.nestedLoopsMultiLang,
        detail: messages.nestedLoopsMultDetail(loopCost, subMax, combined),
        complexity: combined,
      });
    }

    return combined;
  }

  private analyzeSingleFunction(
    node: ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction | ts.MethodDeclaration,
    sourceFile: ts.SourceFile,
    loopAnalyzer: LoopAnalyzer,
    recursionAnalyzer: RecursionAnalyzer,
    spaceAnalyzer: SpaceAnalyzer,
    messages: Messages
  ): FunctionComplexityReport {
    const functionName = this.extractFunctionName(node);
    const { line: startLine } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    const { line: endLine } = sourceFile.getLineAndCharacterOfPosition(node.getEnd());

    const annotations: LineAnnotation[] = [];
    const reasoningSteps: ReasoningStep[] = [];

    const topLoops: LoopComplexityInfo[] = [];
    if (node.body) {
      this.findTopLevelLoops(node.body, loopAnalyzer, topLoops);
    }

    let totalLoopComplexity: BigOComplexity = 'O(1)';
    for (const loop of topLoops) {
      const loopCost = this.calculateLoopTreeCost(loop, annotations, reasoningSteps, messages);
      totalLoopComplexity = maxBigO(totalLoopComplexity, loopCost);
    }

    const recursionInfo = recursionAnalyzer.analyzeFunction(node, functionName, totalLoopComplexity);

    if (recursionInfo.isRecursive) {
      reasoningSteps.push({
        type: 'recursion',
        title: messages.recursionTitle,
        detail: recursionInfo.explanation,
        complexity: recursionInfo.complexity,
      });

      annotations.push({
        line: startLine + 1,
        cost: recursionInfo.complexity,
        label: messages.recursionLabel(recursionInfo.complexity),
        explanation: recursionInfo.explanation,
      });
    }

    const permRegex = /\b(itertools\.)?permutations\b|\b(std::)?next_permutation\b|\b(std::)?prev_permutation\b|\.permutation\b/i;
    const bodyText = node.body ? this.getDirectNodeText(node.body, sourceFile) : '';
    const hasPermutationsCall = permRegex.test(bodyText);

    if (hasPermutationsCall) {
      reasoningSteps.push({
        type: 'summary',
        title: messages.permutationTitle,
        detail: messages.permutationDetail,
        complexity: 'O(n!)',
      });

      annotations.push({
        line: startLine + 1,
        cost: 'O(n!)',
        label: messages.permutationLabel,
        explanation: messages.permutationExplanation,
      });
    }

    let finalTimeComplexity: BigOComplexity = maxBigO(
      maxBigO(totalLoopComplexity, recursionInfo.complexity),
      hasPermutationsCall ? 'O(n!)' : 'O(1)'
    );

    const spaceInfo = spaceAnalyzer.analyzeSpace(node, recursionInfo);
    reasoningSteps.push({
      type: 'space',
      title: messages.spaceTitle,
      detail: spaceInfo.explanation,
      complexity: spaceInfo.spaceComplexity,
    });

    reasoningSteps.push({
      type: 'summary',
      title: messages.summaryFinalResult,
      detail: messages.summaryTimeSpace(finalTimeComplexity, spaceInfo.spaceComplexity),
      complexity: finalTimeComplexity,
    });

    annotations.sort((a, b) => a.line - b.line);

    return {
      functionName,
      startLine: startLine + 1,
      endLine: endLine + 1,
      timeComplexity: finalTimeComplexity,
      spaceComplexity: spaceInfo.spaceComplexity,
      annotations,
      reasoningSteps,
      isRecursive: recursionInfo.isRecursive,
    };
  }

  private calculateLoopTreeCost(
    loop: LoopComplexityInfo,
    annotations: LineAnnotation[],
    reasoningSteps: ReasoningStep[],
    messages: Messages,
    depth: number = 1
  ): BigOComplexity {
    const depthLabel = depth === 1 ? messages.outerLoop : depth === 2 ? messages.innerLoop : messages.loopLevel(depth);

    let subLoopsMaxCost: BigOComplexity = 'O(1)';
    for (const sub of loop.subLoops) {
      const subCost = this.calculateLoopTreeCost(sub, annotations, reasoningSteps, messages, depth + 1);
      subLoopsMaxCost = maxBigO(subLoopsMaxCost, subCost);
    }

    const combined = multiplyBigO(loop.complexity, subLoopsMaxCost);

    annotations.push({
      line: loop.line,
      cost: combined,
      label: `← ${depthLabel}: ${combined}`,
      explanation: loop.explanation + (combined !== loop.complexity ? messages.nestedLoopsWithInner(combined) : ''),
    });

    reasoningSteps.push({
      type: 'loop',
      title: `${depthLabel} (${messages.location} ${loop.line})`,
      detail: `${loop.explanation}${combined !== loop.complexity ? messages.nestedLoopsWithInner(combined) : ''}`,
      complexity: combined,
    });

    if (depth === 1 && combined !== loop.complexity) {
      reasoningSteps.push({
        type: 'loop',
        title: messages.nestedLoopsMultiplication,
        detail: messages.nestedLoopsMultDetail(loop.complexity, subLoopsMaxCost, combined),
        complexity: combined,
      });
    }

    return combined;
  }

  private findTopLevelLoops(node: ts.Node, loopAnalyzer: LoopAnalyzer, results: LoopComplexityInfo[]): void {
    ts.forEachChild(node, (child) => {
      if (
        ts.isForStatement(child) ||
        ts.isWhileStatement(child) ||
        ts.isDoStatement(child) ||
        ts.isForOfStatement(child) ||
        ts.isForInStatement(child)
      ) {
        results.push(loopAnalyzer.analyzeLoop(child as ts.Statement));
      } else if (
        ts.isFunctionDeclaration(child) ||
        ts.isFunctionExpression(child) ||
        ts.isArrowFunction(child) ||
        ts.isMethodDeclaration(child)
      ) {
        return;
      } else {
        this.findTopLevelLoops(child, loopAnalyzer, results);
      }
    });
  }

  private extractFunctionName(
    node: ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction | ts.MethodDeclaration
  ): string {
    if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
      return node.name ? node.name.getText() : 'função anônima';
    }

    if (ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)) {
      return node.parent.name.getText();
    }

    return 'função anônima';
  }

  private getDirectNodeText(node: ts.Node, sourceFile: ts.SourceFile): string {
    let directText = '';
    const visit = (child: ts.Node) => {
      if (
        child !== node &&
        (ts.isFunctionDeclaration(child) ||
          ts.isFunctionExpression(child) ||
          ts.isArrowFunction(child) ||
          ts.isMethodDeclaration(child))
      ) {
        return;
      }
      directText += ' ' + child.getText(sourceFile);
    };
    ts.forEachChild(node, visit);
    return directText.length > 0 ? directText : node.getText(sourceFile);
  }
}
