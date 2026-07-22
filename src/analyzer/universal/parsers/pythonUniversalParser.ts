import { UniversalFunctionNode, UniversalLoopNode, UniversalCallNode } from '../types';

export class PythonUniversalParser {
  public parse(code: string): UniversalFunctionNode[] {
    const lines = code.split(/\r?\n/);
    const functions: UniversalFunctionNode[] = [];

    let currentFn: {
      name: string;
      startLine: number;
      parameters: string[];
      bodyLines: { line: number; text: string; indent: number }[];
      indent: number;
    } | null = null;

    const topLevelLines: { line: number; text: string; indent: number }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i];
      const trimmed = lineText.trim();
      const lineNum = i + 1;

      if (!trimmed || trimmed.startsWith('#')) continue;

      const indent = lineText.search(/\S/);

      const defMatch = trimmed.match(/^def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*:/);
      if (defMatch) {
        if (currentFn) {
          functions.push(this.buildFunctionNode(currentFn, lines.length));
        }
        currentFn = {
          name: defMatch[1],
          startLine: lineNum,
          parameters: defMatch[2].split(',').map((p) => p.trim()),
          bodyLines: [],
          indent,
        };
        continue;
      }

      if (currentFn) {
        if (indent <= currentFn.indent && trimmed.length > 0) {
          functions.push(this.buildFunctionNode(currentFn, lineNum - 1));
          currentFn = null;

          const nextDef = trimmed.match(/^def\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*:/);
          if (nextDef) {
            currentFn = {
              name: nextDef[1],
              startLine: lineNum,
              parameters: nextDef[2].split(',').map((p) => p.trim()),
              bodyLines: [],
              indent,
            };
          } else {
            topLevelLines.push({ line: lineNum, text: trimmed, indent });
          }
        } else {
          currentFn.bodyLines.push({ line: lineNum, text: trimmed, indent });
        }
      } else {
        topLevelLines.push({ line: lineNum, text: trimmed, indent });
      }
    }

    if (currentFn) {
      functions.push(this.buildFunctionNode(currentFn, lines.length));
    }

    // Se houver laços fora de funções (script principal) ou nenhuma função for definida
    const mainLoops = this.extractLoops(topLevelLines);
    if (mainLoops.length > 0 || functions.length === 0) {
      const scriptText = topLevelLines.map((l) => l.text).join('\n');
      const hasDivisionInBody =
        scriptText.includes('// 2') ||
        scriptText.includes('/ 2') ||
        scriptText.includes('//= 2') ||
        scriptText.includes('/= 2') ||
        scriptText.includes('>> 1') ||
        scriptText.includes('>>= 1');

      functions.unshift({
        type: 'function',
        name: '<script principal>',
        startLine: 1,
        endLine: lines.length,
        parameters: [],
        bodyText: scriptText,
        loops: mainLoops,
        recursiveCalls: [],
        hasDivisionInBody,
      });
    }

    return functions;
  }

  private buildFunctionNode(
    rawFn: {
      name: string;
      startLine: number;
      parameters: string[];
      bodyLines: { line: number; text: string; indent: number }[];
      indent: number;
    },
    fallbackEndLine: number
  ): UniversalFunctionNode {
    const endLine = rawFn.bodyLines.length > 0 ? rawFn.bodyLines[rawFn.bodyLines.length - 1].line : fallbackEndLine;
    const bodyText = rawFn.bodyLines.map((l) => l.text).join('\n');

    const hasDivisionInBody =
      bodyText.includes('// 2') ||
      bodyText.includes('/ 2') ||
      bodyText.includes('//= 2') ||
      bodyText.includes('/= 2') ||
      bodyText.includes('>> 1') ||
      bodyText.includes('>>= 1');

    const recursiveCalls: UniversalCallNode[] = [];
    const callRegex = new RegExp(`\\b${rawFn.name}\\s*\\(([^)]*)\\)`, 'g');
    for (const bLine of rawFn.bodyLines) {
      let match;
      while ((match = callRegex.exec(bLine.text)) !== null) {
        recursiveCalls.push({
          type: 'call',
          name: rawFn.name,
          line: bLine.line,
          argsText: match[1],
        });
      }
    }

    const loops = this.extractLoops(rawFn.bodyLines);

    return {
      type: 'function',
      name: rawFn.name,
      startLine: rawFn.startLine,
      endLine,
      parameters: rawFn.parameters,
      bodyText,
      loops,
      recursiveCalls,
      hasDivisionInBody,
    };
  }

  private extractLoops(lines: { line: number; text: string; indent: number }[]): UniversalLoopNode[] {
    const topLoops: UniversalLoopNode[] = [];
    const stack: { node: UniversalLoopNode; indent: number }[] = [];

    for (const l of lines) {
      const isFor = l.text.startsWith('for ');
      const isWhile = l.text.startsWith('while ');

      if (isFor || isWhile) {
        let stepType: 'linear' | 'logarithmic' | 'sqrt' = 'linear';
        let explanation = 'Laço Python com passo linear O(n)';

        if (isWhile) {
          if (
            /\/=\s*\d+/.test(l.text) ||
            /\/\/=\s*\d+/.test(l.text) ||
            /\*=\s*\d+/.test(l.text) ||
            /\/\/\s*\d+/.test(l.text) ||
            /\/\s*\d+/.test(l.text) ||
            />>=\s*\d+/.test(l.text) ||
            />>\s*\d+/.test(l.text)
          ) {
            stepType = 'logarithmic';
            explanation = 'Laço while Python dividindo por constante -> O(log n)';
          }
        }

        const loopNode: UniversalLoopNode = {
          type: 'loop',
          loopKind: isFor ? 'for' : 'while',
          line: l.line,
          stepType,
          explanation,
          subLoops: [],
        };

        while (stack.length > 0 && stack[stack.length - 1].indent >= l.indent) {
          stack.pop();
        }

        if (stack.length === 0) {
          topLoops.push(loopNode);
        } else {
          stack[stack.length - 1].node.subLoops.push(loopNode);
        }

        stack.push({ node: loopNode, indent: l.indent });
      } else {
        if (stack.length > 0 && stack[stack.length - 1].node.loopKind === 'while') {
          if (
            /\/=\s*\d+/.test(l.text) ||
            /\/\/=\s*\d+/.test(l.text) ||
            /\*=\s*\d+/.test(l.text) ||
            /\/\/\s*\d+/.test(l.text) ||
            /\/\s*\d+/.test(l.text) ||
            />>=\s*\d+/.test(l.text) ||
            />>\s*\d+/.test(l.text)
          ) {
            stack[stack.length - 1].node.stepType = 'logarithmic';
            stack[stack.length - 1].node.explanation =
              'Laço while Python com divisão de variável de controle -> O(log n)';
          }
        }
      }
    }

    return topLoops;
  }
}
