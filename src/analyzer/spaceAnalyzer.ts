import * as ts from 'typescript';
import { BigOComplexity } from './types';
import { RecursionAnalysisResult } from './recursionAnalyzer';

export class SpaceAnalyzer {
  constructor(private sourceFile: ts.SourceFile) {}

  public analyzeSpace(
    functionNode: ts.Node,
    recursionInfo: RecursionAnalysisResult
  ): { spaceComplexity: BigOComplexity; explanation: string } {
    let spaceComplexity: BigOComplexity = 'O(1)';
    let explanation = 'Espaço auxiliar constante O(1) (sem alocações dinâmicas ou pilha profunda)';

    if (recursionInfo.isRecursive) {
      if (recursionInfo.reductionType === 'division') {
        spaceComplexity = 'O(log n)';
        explanation = 'Profundidade máxima da pilha de chamadas recursivas é O(log n)';
      } else {
        spaceComplexity = 'O(n)';
        explanation = 'Profundidade máxima da pilha de chamadas recursivas é O(n)';
      }
    }

    const bodyText = functionNode.getText(this.sourceFile);
    if (
      bodyText.includes('new Array(') ||
      bodyText.includes('.fill(') ||
      bodyText.includes('Array.from') ||
      bodyText.includes('new Matrix') ||
      bodyText.includes('.push(')
    ) {
      if (
        (bodyText.includes('new Array(') && bodyText.includes('.map(')) ||
        bodyText.includes('matrix') ||
        bodyText.includes('tabulation')
      ) {
        if (spaceComplexity === 'O(1)' || spaceComplexity === 'O(n)' || spaceComplexity === 'O(log n)') {
          spaceComplexity = 'O(n^2)';
          explanation = 'Alocação de estrutura de dados bidimensional (matriz/tabela) de tamanho O(n²)';
        }
      } else {
        if (spaceComplexity === 'O(1)') {
          spaceComplexity = 'O(n)';
          explanation = 'Alocação de vetor/lista com tamanho proporcional a N → O(n)';
        }
      }
    }

    return { spaceComplexity, explanation };
  }
}
