import * as ts from 'typescript';
import { BigOComplexity } from './types';

export interface LoopComplexityInfo {
  complexity: BigOComplexity;
  line: number;
  explanation: string;
  subLoops: LoopComplexityInfo[];
}

export class LoopAnalyzer {
  constructor(private sourceFile: ts.SourceFile) {}

  public analyzeLoop(node: ts.Statement): LoopComplexityInfo {
    const line = this.getLineNumber(node);
    let selfComplexity: BigOComplexity = 'O(n)';
    let explanation = 'Laço com iteração linear O(n)';

    if (ts.isForStatement(node)) {
      const step = this.analyzeForStatement(node);
      selfComplexity = step.complexity;
      explanation = step.explanation;
    } else if (ts.isWhileStatement(node) || ts.isDoStatement(node)) {
      const step = this.analyzeWhileStatement(node);
      selfComplexity = step.complexity;
      explanation = step.explanation;
    } else if (ts.isForOfStatement(node) || ts.isForInStatement(node)) {
      selfComplexity = 'O(n)';
      explanation = 'Laço que percorre cada elemento da estrutura O(n)';
    }

    const subLoops: LoopComplexityInfo[] = [];
    let body: ts.Statement | undefined;
    if (
      ts.isForStatement(node) ||
      ts.isWhileStatement(node) ||
      ts.isDoStatement(node) ||
      ts.isForOfStatement(node) ||
      ts.isForInStatement(node)
    ) {
      body = node.statement;
    }
    if (body) {
      this.findChildLoops(body, subLoops);
    }

    return {
      complexity: selfComplexity,
      line,
      explanation,
      subLoops,
    };
  }

  private findChildLoops(node: ts.Node, results: LoopComplexityInfo[]): void {
    ts.forEachChild(node, (child) => {
      if (
        ts.isForStatement(child) ||
        ts.isWhileStatement(child) ||
        ts.isDoStatement(child) ||
        ts.isForOfStatement(child) ||
        ts.isForInStatement(child)
      ) {
        results.push(this.analyzeLoop(child as ts.Statement));
      } else {
        this.findChildLoops(child, results);
      }
    });
  }

  private analyzeForStatement(node: ts.ForStatement): {
    complexity: BigOComplexity;
    explanation: string;
  } {
    const directBodyText = this.getDirectBodyTextWithoutSubLoops(node);
    if (node.incrementor) {
      const incText = node.incrementor.getText(this.sourceFile);
      if (
        incText.includes('*=') ||
        incText.includes('/=') ||
        incText.includes('>>=') ||
        incText.includes('<<=') ||
        /\*\s*\d+/.test(incText) ||
        /\/\s*\d+/.test(incText) ||
        />>\s*\d+/.test(incText) ||
        /<<\s*\d+/.test(incText)
      ) {
        return {
          complexity: 'O(log n)',
          explanation: `Laço com passo multiplicativo/divisivo (${incText}) → O(log n)`,
        };
      }
    }

    if (
      /\/=\s*\d+/.test(directBodyText) ||
      /\*=\s*\d+/.test(directBodyText) ||
      /\/\s*[2-9]/.test(directBodyText) ||
      /\*\s*[2-9]/.test(directBodyText) ||
      />>=\s*\d+/.test(directBodyText) ||
      /<<=\s*\d+/.test(directBodyText) ||
      />>\s*\d+/.test(directBodyText) ||
      /<<\s*\d+/.test(directBodyText) ||
      directBodyText.includes('Math.floor') ||
      directBodyText.includes('Math.trunc')
    ) {
      return {
        complexity: 'O(log n)',
        explanation: 'Laço for com alteração multiplicativa/divisiva no corpo → O(log n)',
      };
    }

    if (node.condition) {
      const condText = node.condition.getText(this.sourceFile);
      if (condText.includes('* i') || condText.includes('sqrt') || condText.includes('Math.sqrt')) {
        return {
          complexity: 'O(sqrt n)',
          explanation: `Laço com limite quadrático (${condText}) → O(sqrt n)`,
        };
      }
    }

    return {
      complexity: 'O(n)',
      explanation: 'Laço for com passo linear → O(n)',
    };
  }

  private analyzeWhileStatement(node: ts.WhileStatement | ts.DoStatement): {
    complexity: BigOComplexity;
    explanation: string;
  } {
    const directBodyText = this.getDirectBodyTextWithoutSubLoops(node);
    const condText = node.expression ? node.expression.getText(this.sourceFile) : '';

    if (
      /\/=\s*\d+/.test(directBodyText) ||
      /\*=\s*\d+/.test(directBodyText) ||
      /\/\s*[2-9]/.test(directBodyText) ||
      /\*\s*[2-9]/.test(directBodyText) ||
      />>=\s*\d+/.test(directBodyText) ||
      /<<=\s*\d+/.test(directBodyText) ||
      />>\s*\d+/.test(directBodyText) ||
      /<<\s*\d+/.test(directBodyText) ||
      directBodyText.includes('Math.floor') ||
      directBodyText.includes('Math.trunc')
    ) {
      return {
        complexity: 'O(log n)',
        explanation: 'Laço while dividindo/multiplicando variável de controle por constante → O(log n)',
      };
    }

    if (condText.includes('sqrt') || condText.includes('Math.sqrt')) {
      return {
        complexity: 'O(sqrt n)',
        explanation: 'Laço while com verificação de raiz quadrada → O(sqrt n)',
      };
    }

    return {
      complexity: 'O(n)',
      explanation: 'Laço while com decremento/incremento linear → O(n)',
    };
  }

  private getDirectBodyTextWithoutSubLoops(node: ts.Statement): string {
    let bodyNode: ts.Node | undefined;
    if (
      ts.isForStatement(node) ||
      ts.isWhileStatement(node) ||
      ts.isDoStatement(node) ||
      ts.isForOfStatement(node) ||
      ts.isForInStatement(node)
    ) {
      bodyNode = node.statement;
    }
    if (!bodyNode) return '';

    let directText = '';
    if (ts.isBlock(bodyNode)) {
      for (const stmt of bodyNode.statements) {
        if (
          !ts.isForStatement(stmt) &&
          !ts.isWhileStatement(stmt) &&
          !ts.isDoStatement(stmt) &&
          !ts.isForOfStatement(stmt) &&
          !ts.isForInStatement(stmt)
        ) {
          directText += stmt.getText(this.sourceFile) + '\n';
        }
      }
    } else {
      if (
        !ts.isForStatement(bodyNode) &&
        !ts.isWhileStatement(bodyNode) &&
        !ts.isDoStatement(bodyNode) &&
        !ts.isForOfStatement(bodyNode) &&
        !ts.isForInStatement(bodyNode)
      ) {
        directText = bodyNode.getText(this.sourceFile);
      }
    }

    return directText;
  }

  private getLineNumber(node: ts.Node): number {
    const { line } = this.sourceFile.getLineAndCharacterOfPosition(node.getStart(this.sourceFile));
    return line + 1;
  }
}

export function multiplyBigO(a: BigOComplexity, b: BigOComplexity): BigOComplexity {
  if (a === 'O(1)') return b;
  if (b === 'O(1)') return a;

  if (a === 'O(n!)' || b === 'O(n!)') return 'O(n!)';
  if (a === 'O(2^n)' || b === 'O(2^n)') return 'O(2^n)';
  if (a === 'O(log n)' && b === 'O(log n)') return 'O(log n)';
  if ((a === 'O(n)' && b === 'O(log n)') || (a === 'O(log n)' && b === 'O(n)')) return 'O(n log n)';
  if (a === 'O(n)' && b === 'O(n)') return 'O(n^2)';
  if ((a === 'O(n^2)' && b === 'O(n)') || (a === 'O(n)' && b === 'O(n^2)')) return 'O(n^3)';
  if (a === 'O(n^2)' && b === 'O(n^2)') return 'O(n^4)';
  if ((a === 'O(n^3)' && b === 'O(n)') || (a === 'O(n)' && b === 'O(n^3)')) return 'O(n^4)';

  return 'O(n^2)';
}

export function maxBigO(a: BigOComplexity, b: BigOComplexity): BigOComplexity {
  const rank: Record<BigOComplexity, number> = {
    'O(1)': 1,
    'O(log n)': 2,
    'O(sqrt n)': 3,
    'O(n)': 4,
    'O(n log n)': 5,
    'O(n^2)': 6,
    'O(n^3)': 7,
    'O(n^4)': 8,
    'O(2^n)': 9,
    'O(n!)': 10,
    'O(desconhecido)': 0,
  };

  return rank[a] >= rank[b] ? a : b;
}
