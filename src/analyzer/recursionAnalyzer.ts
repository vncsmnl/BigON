import * as ts from 'typescript';
import { BigOComplexity } from './types';

export interface RecursionAnalysisResult {
  isRecursive: boolean;
  callCount: number;
  reductionType: 'subtraction' | 'division' | 'unknown';
  complexity: BigOComplexity;
  explanation: string;
}

export class RecursionAnalyzer {
  constructor(private sourceFile: ts.SourceFile) {}

  public analyzeFunction(
    functionNode: ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction | ts.MethodDeclaration,
    functionName: string,
    loopComplexityInFunction: BigOComplexity
  ): RecursionAnalysisResult {
    if (!functionName || functionName === 'função anônima') {
      return {
        isRecursive: false,
        callCount: 0,
        reductionType: 'unknown',
        complexity: 'O(1)',
        explanation: 'Função sem recursão identificada',
      };
    }

    const recursiveCalls: ts.CallExpression[] = [];
    this.findSelfCalls(functionNode.body, functionName, recursiveCalls);

    if (recursiveCalls.length === 0) {
      return {
        isRecursive: false,
        callCount: 0,
        reductionType: 'unknown',
        complexity: 'O(1)',
        explanation: 'Nenhuma auto-chamada recursiva encontrada',
      };
    }

    const callsInPath = this.getMaxCallsInPath(functionNode.body, functionName);

    let hasDivision = false;
    let hasSubtraction = false;

    const bodyText = functionNode.body ? functionNode.body.getText(this.sourceFile) : '';

    if (
      bodyText.includes('/ 2') ||
      bodyText.includes('/2') ||
      bodyText.includes('>> 1') ||
      bodyText.includes('>>= 1') ||
      bodyText.includes('Math.floor') ||
      bodyText.includes('Math.trunc')
    ) {
      hasDivision = true;
    }

    for (const call of recursiveCalls) {
      const argsText = call.arguments.map((arg) => arg.getText(this.sourceFile)).join(' ');
      if (argsText.includes('- 1') || argsText.includes('-1') || argsText.includes('-')) {
        hasSubtraction = true;
      }
    }

    const reductionType = hasDivision ? 'division' : hasSubtraction ? 'subtraction' : 'unknown';

    let complexity: BigOComplexity = 'O(n)';
    let explanation = '';

    const hasCallInsideLoop = recursiveCalls.some((call) => this.isCallInsideLoop(call));

    if (callsInPath <= 1) {
      if (hasDivision) {
        complexity = 'O(log n)';
        explanation = `Recursão simples com divisão por 2 em ramo único T(n) = T(n/2) + O(1) → O(log n) (Ex: Busca Binária)`;
      } else if (hasCallInsideLoop && (loopComplexityInFunction === 'O(n)' || loopComplexityInFunction === 'O(n^2)')) {
        complexity = 'O(n!)';
        explanation = `Chamada recursiva executada dentro de laço linear T(n) = n * T(n-1) → Custo Fatorial O(n!) (Ex: Permutações)`;
      } else if (loopComplexityInFunction === 'O(n)') {
        complexity = 'O(n^2)';
        explanation = `Recursão simples com laço linear T(n) = T(n-1) + O(n) → O(n²) (Ex: Selection Sort / Insertion Sort)`;
      } else if (loopComplexityInFunction === 'O(n^2)') {
        complexity = 'O(n^3)';
        explanation = `Recursão simples com laço quadrático T(n) = T(n-1) + O(n²) → O(n³)`;
      } else {
        complexity = 'O(n)';
        explanation = `Recursão linear T(n) = T(n-1) + O(1) → O(n)`;
      }
    } else {
      if (hasDivision) {
        if (loopComplexityInFunction === 'O(n)') {
          complexity = 'O(n log n)';
          explanation = `Teorema Mestre: T(n) = ${callsInPath}T(n/2) + O(n) → O(n log n) (Ex: Merge Sort)`;
        } else {
          complexity = 'O(n)';
          explanation = `Teorema Mestre: T(n) = ${callsInPath}T(n/2) + O(1) → O(n) (Árvore de recursão)`;
        }
      } else if (hasSubtraction) {
        if (loopComplexityInFunction === 'O(n)' || loopComplexityInFunction === 'O(n^2)') {
          complexity = 'O(n!)';
          explanation = `Múltiplas chamadas recursivas com laço linear T(n) = n * T(n-1) → Custo Fatorial O(n!) (Ex: Permutações)`;
        } else {
          complexity = 'O(2^n)';
          explanation = `Recursão ramificada no mesmo caminho T(n) = 2T(n-1) → Custo Exponencial O(2^n) (Ex: Fibonacci Ingênuo)`;
        }
      } else {
        if (loopComplexityInFunction === 'O(n)' || loopComplexityInFunction === 'O(n^2)') {
          complexity = 'O(n!)';
          explanation = `Múltiplas chamadas recursivas com laço linear → O(n!) (Ex: Permutações)`;
        } else {
          complexity = 'O(2^n)';
          explanation = `Múltiplas chamadas recursivas no mesmo caminho → O(2^n)`;
        }
      }
    }

    return {
      isRecursive: true,
      callCount: callsInPath,
      reductionType,
      complexity,
      explanation,
    };
  }

  private getMaxCallsInPath(node: ts.Node | undefined, functionName: string): number {
    if (!node) return 0;

    if (ts.isBlock(node) || ts.isSourceFile(node)) {
      return this.getMaxCallsInStatements(node.statements, functionName);
    }

    if (ts.isIfStatement(node)) {
      const thenCalls = this.getMaxCallsInPath(node.thenStatement, functionName);
      const elseCalls = node.elseStatement ? this.getMaxCallsInPath(node.elseStatement, functionName) : 0;
      return Math.max(thenCalls, elseCalls);
    }

    if (ts.isCallExpression(node)) {
      const callerName = node.expression.getText(this.sourceFile);
      const isSelf = callerName === functionName || callerName.endsWith(`.${functionName}`);
      let argCalls = 0;
      for (const arg of node.arguments) {
        argCalls += this.getMaxCallsInPath(arg, functionName);
      }
      return (isSelf ? 1 : 0) + argCalls;
    }

    let count = 0;
    node.forEachChild((child) => {
      count += this.getMaxCallsInPath(child, functionName);
    });

    return count;
  }

  private getMaxCallsInStatements(statements: ts.NodeArray<ts.Statement>, functionName: string): number {
    if (statements.length === 0) return 0;

    let maxCalls = 0;
    let currentAccumulated = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];

      if (ts.isIfStatement(stmt)) {
        const thenCalls = this.getMaxCallsInPath(stmt.thenStatement, functionName);
        const elseCalls = stmt.elseStatement ? this.getMaxCallsInPath(stmt.elseStatement, functionName) : 0;

        const thenReturns = this.statementAlwaysReturns(stmt.thenStatement);

        if (thenReturns) {
          const restStatements = statements.slice(i + 1);
          const restCalls = this.getMaxCallsInStatements(
            ts.factory.createNodeArray(restStatements),
            functionName
          );

          const branchThenPath = currentAccumulated + thenCalls;
          const branchElsePath = currentAccumulated + Math.max(elseCalls, restCalls);
          return Math.max(maxCalls, Math.max(branchThenPath, branchElsePath));
        } else {
          currentAccumulated += Math.max(thenCalls, elseCalls);
        }
      } else {
        currentAccumulated += this.getMaxCallsInPath(stmt, functionName);
      }
    }

    return Math.max(maxCalls, currentAccumulated);
  }

  private statementAlwaysReturns(node: ts.Node): boolean {
    if (ts.isReturnStatement(node)) return true;
    if (ts.isBlock(node)) {
      return node.statements.some((stmt) => this.statementAlwaysReturns(stmt));
    }
    if (ts.isIfStatement(node)) {
      return (
        this.statementAlwaysReturns(node.thenStatement) &&
        node.elseStatement !== undefined &&
        this.statementAlwaysReturns(node.elseStatement)
      );
    }
    return false;
  }

  private findSelfCalls(node: ts.Node | undefined, functionName: string, results: ts.CallExpression[]): void {
    if (!node) return;

    ts.forEachChild(node, (child) => {
      if (ts.isCallExpression(child)) {
        const callerName = child.expression.getText(this.sourceFile);
        if (callerName === functionName || callerName.endsWith(`.${functionName}`)) {
          results.push(child);
        }
      }
      this.findSelfCalls(child, functionName, results);
    });
  }

  private isCallInsideLoop(node: ts.Node): boolean {
    let current: ts.Node | undefined = node.parent;
    while (current) {
      if (
        ts.isForStatement(current) ||
        ts.isWhileStatement(current) ||
        ts.isDoStatement(current) ||
        ts.isForOfStatement(current) ||
        ts.isForInStatement(current)
      ) {
        return true;
      }
      if (
        ts.isFunctionDeclaration(current) ||
        ts.isFunctionExpression(current) ||
        ts.isArrowFunction(current) ||
        ts.isMethodDeclaration(current)
      ) {
        break;
      }
      current = current.parent;
    }
    return false;
  }
}
