import * as ts from 'typescript';
import { ASTParser } from './astParser';
import { LoopAnalyzer, LoopComplexityInfo, multiplyBigO, maxBigO } from './loopAnalyzer';
import { RecursionAnalyzer } from './recursionAnalyzer';
import { SpaceAnalyzer } from './spaceAnalyzer';
import { UniversalParserRouter, normalizeLanguageId } from './universal/universalParserRouter';
import { UniversalFunctionNode, UniversalLoopNode } from './universal/types';
import {
  BigOComplexity,
  FileAnalysisResult,
  FunctionComplexityReport,
  LineAnnotation,
  ReasoningStep,
} from './types';

export class ComplexityEngine {
  private router = new UniversalParserRouter();

  public analyzeCode(code: string, filePath: string = 'file.ts', languageId: string = 'typescript'): FileAnalysisResult {
    const normLang = normalizeLanguageId(languageId, filePath);

    if (normLang === 'python' || normLang === 'ruby' || normLang === 'cpp' || normLang === 'c') {
      return this.analyzeUniversalCode(code, filePath, normLang);
    }

    const sourceFile = ASTParser.parseSource(code, filePath);
    const functions: FunctionComplexityReport[] = [];

    const loopAnalyzer = new LoopAnalyzer(sourceFile);
    const recursionAnalyzer = new RecursionAnalyzer(sourceFile);
    const spaceAnalyzer = new SpaceAnalyzer(sourceFile);

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
          spaceAnalyzer
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

  private analyzeUniversalCode(code: string, filePath: string, languageId: string): FileAnalysisResult {
    const universalFile = this.router.parse(code, languageId, filePath);
    const functions: FunctionComplexityReport[] = [];

    for (const uFn of universalFile.functions) {
      functions.push(this.analyzeUniversalFunction(uFn));
    }

    return {
      filePath,
      functions,
    };
  }

  private analyzeUniversalFunction(uFn: UniversalFunctionNode): FunctionComplexityReport {
    const annotations: LineAnnotation[] = [];
    const reasoningSteps: ReasoningStep[] = [];

    let totalLoopComplexity: BigOComplexity = 'O(1)';
    for (const loop of uFn.loops) {
      const loopCost = this.calculateUniversalLoopCost(loop, annotations, reasoningSteps);
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
        title: `Análise de Recursão (${uFn.name})`,
        detail: `Detectadas ${callCount} auto-chamadas recursivas em ${uFn.name}${
          recursionComplexity === 'O(n!)' ? ' combinadas com laço linear T(n) = n * T(n-1) → O(n!)' : ''
        }`,
        complexity: recursionComplexity,
      });

      annotations.push({
        line: uFn.startLine,
        cost: recursionComplexity,
        label: `← Recursão: ${recursionComplexity}`,
        explanation: `Chamada recursiva na função ${uFn.name}`,
      });
    }

    const permRegex = /\b(itertools\.)?permutations\b|\b(std::)?next_permutation\b|\b(std::)?prev_permutation\b|\.permutation\b/i;
    let hasPermutationsCall = permRegex.test(uFn.bodyText);
    let permComplexity: BigOComplexity = hasPermutationsCall ? 'O(n!)' : 'O(1)';

    if (hasPermutationsCall) {
      reasoningSteps.push({
        type: 'summary',
        title: 'Uso de Gerador/Função de Permutação',
        detail: 'Detectada chamada para gerador ou função de permutação (ex: permutations / next_permutation) → Custo Fatorial O(n!)',
        complexity: 'O(n!)',
      });

      annotations.push({
        line: uFn.startLine,
        cost: 'O(n!)',
        label: '← Permutação: O(n!)',
        explanation: 'Função executa operação de permutação O(n!)',
      });
    }

    let finalTimeComplexity: BigOComplexity = maxBigO(
      maxBigO(totalLoopComplexity, recursionComplexity),
      permComplexity
    );

    let spaceComplexity: BigOComplexity = 'O(1)';
    let spaceDetail = 'Espaço constante O(1)';
    if (isRecursive) {
      spaceComplexity = uFn.hasDivisionInBody ? 'O(log n)' : 'O(n)';
      spaceDetail = `Pilha de chamadas recursivas com profundidade ${spaceComplexity}`;
    } else if (hasPermutationsCall) {
      spaceComplexity = 'O(n)';
      spaceDetail = 'Estrutura/Gerador de permutações aloca espaço O(n)';
    }

    reasoningSteps.push({
      type: 'space',
      title: 'Análise de Espaço',
      detail: spaceDetail,
      complexity: spaceComplexity,
    });

    reasoningSteps.push({
      type: 'summary',
      title: 'Resultado Final Assintótico',
      detail: `Tempo: ${finalTimeComplexity} | Espaço: ${spaceComplexity}`,
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
    depth: number = 1
  ): BigOComplexity {
    const loopCost: BigOComplexity = loop.stepType === 'logarithmic' ? 'O(log n)' : loop.stepType === 'sqrt' ? 'O(sqrt n)' : 'O(n)';
    const depthLabel = depth === 1 ? 'Laço externo' : depth === 2 ? 'Laço interno' : `Laço nível ${depth}`;

    let subMax: BigOComplexity = 'O(1)';
    for (const sub of loop.subLoops) {
      const c = this.calculateUniversalLoopCost(sub, annotations, reasoningSteps, depth + 1);
      subMax = maxBigO(subMax, c);
    }

    const combined = multiplyBigO(loopCost, subMax);

    annotations.push({
      line: loop.line,
      cost: combined,
      label: `← ${depthLabel}: ${combined}`,
      explanation: loop.explanation + (combined !== loopCost ? ` (com laços internos → ${combined})` : ''),
    });

    reasoningSteps.push({
      type: 'loop',
      title: `${depthLabel} (Linha ${loop.line})`,
      detail: `${loop.explanation}${combined !== loopCost ? ` (com laços internos → ${combined})` : ''}`,
      complexity: combined,
    });

    if (depth === 1 && combined !== loopCost) {
      reasoningSteps.push({
        type: 'loop',
        title: 'Multiplicação de Laços Aninhados Multi-Linguagem',
        detail: `${loopCost} (externo) × ${subMax} (interno) → ${combined}`,
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
    spaceAnalyzer: SpaceAnalyzer
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
      const loopCost = this.calculateLoopTreeCost(loop, annotations, reasoningSteps);
      totalLoopComplexity = maxBigO(totalLoopComplexity, loopCost);
    }

    const recursionInfo = recursionAnalyzer.analyzeFunction(node, functionName, totalLoopComplexity);

    if (recursionInfo.isRecursive) {
      reasoningSteps.push({
        type: 'recursion',
        title: 'Análise de Recursão',
        detail: recursionInfo.explanation,
        complexity: recursionInfo.complexity,
      });

      annotations.push({
        line: startLine + 1,
        cost: recursionInfo.complexity,
        label: `← Recursão: ${recursionInfo.complexity}`,
        explanation: recursionInfo.explanation,
      });
    }

    const permRegex = /\b(itertools\.)?permutations\b|\b(std::)?next_permutation\b|\b(std::)?prev_permutation\b|\.permutation\b/i;
    const bodyText = node.body ? node.body.getText(sourceFile) : '';
    const hasPermutationsCall = permRegex.test(bodyText);

    if (hasPermutationsCall) {
      reasoningSteps.push({
        type: 'summary',
        title: 'Uso de Gerador/Função de Permutação',
        detail: 'Detectada chamada para gerador ou função de permutação (permutations) → Custo Fatorial O(n!)',
        complexity: 'O(n!)',
      });

      annotations.push({
        line: startLine + 1,
        cost: 'O(n!)',
        label: '← Permutação: O(n!)',
        explanation: 'Função executa operação de permutação O(n!)',
      });
    }

    let finalTimeComplexity: BigOComplexity = maxBigO(
      maxBigO(totalLoopComplexity, recursionInfo.complexity),
      hasPermutationsCall ? 'O(n!)' : 'O(1)'
    );

    const spaceInfo = spaceAnalyzer.analyzeSpace(node, recursionInfo);
    reasoningSteps.push({
      type: 'space',
      title: 'Análise de Espaço Memória',
      detail: spaceInfo.explanation,
      complexity: spaceInfo.spaceComplexity,
    });

    reasoningSteps.push({
      type: 'summary',
      title: 'Resultado Final da Análise Assintótica',
      detail: `Tempo: ${finalTimeComplexity} | Espaço: ${spaceInfo.spaceComplexity}`,
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
    depth: number = 1
  ): BigOComplexity {
    const depthLabel = depth === 1 ? 'Laço externo' : depth === 2 ? 'Laço interno' : `Laço nível ${depth}`;

    let subLoopsMaxCost: BigOComplexity = 'O(1)';
    for (const sub of loop.subLoops) {
      const subCost = this.calculateLoopTreeCost(sub, annotations, reasoningSteps, depth + 1);
      subLoopsMaxCost = maxBigO(subLoopsMaxCost, subCost);
    }

    const combined = multiplyBigO(loop.complexity, subLoopsMaxCost);

    annotations.push({
      line: loop.line,
      cost: combined,
      label: `← ${depthLabel}: ${combined}`,
      explanation: loop.explanation + (combined !== loop.complexity ? ` (com laços internos → ${combined})` : ''),
    });

    reasoningSteps.push({
      type: 'loop',
      title: `${depthLabel} (Linha ${loop.line})`,
      detail: `${loop.explanation}${combined !== loop.complexity ? ` (com laços internos → ${combined})` : ''}`,
      complexity: combined,
    });

    if (depth === 1 && combined !== loop.complexity) {
      reasoningSteps.push({
        type: 'loop',
        title: 'Multiplicação dos Laços Aninhados',
        detail: `${loop.complexity} (externo) × ${subLoopsMaxCost} (interno) → ${combined}`,
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
}
