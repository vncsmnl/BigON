import { UniversalFunctionNode, UniversalLoopNode, UniversalCallNode } from '../types';
import { Messages } from '../../../i18n/messages';
import { getMessages } from '../../../i18n';

export class RubyUniversalParser {
  constructor(private messages: Messages = getMessages('en')) {}

  public parse(code: string): UniversalFunctionNode[] {
    const lines = code.split(/\r?\n/);
    const functions: UniversalFunctionNode[] = [];

    let currentFn: {
      name: string;
      startLine: number;
      bodyLines: { line: number; text: string }[];
    } | null = null;

    const topLevelLines: { line: number; text: string }[] = [];
    let depth = 0;

    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i];
      const trimmed = lineText.trim();
      const lineNum = i + 1;

      if (!trimmed || trimmed.startsWith('#')) continue;

      const defMatch = trimmed.match(/^def\s+([a-zA-Z0-9_!\?]+)(?:\s*\(([^)]*)\))?/);
      if (defMatch) {
        currentFn = {
          name: defMatch[1],
          startLine: lineNum,
          bodyLines: [],
        };
        depth = 1;
        continue;
      }

      if (currentFn) {
        if (trimmed.match(/\bdef\b|\bdo\b|\bif\b|\bunless\b|\bwhile\b|\bcase\b/)) {
          depth++;
        }

        if (trimmed === 'end' || trimmed.endsWith(' end')) {
          depth--;
          if (depth === 0) {
            functions.push(this.buildFunctionNode(currentFn, lineNum));
            currentFn = null;
            continue;
          }
        }

        currentFn.bodyLines.push({ line: lineNum, text: trimmed });
      } else {
        topLevelLines.push({ line: lineNum, text: trimmed });
      }
    }

    const mainLoops = this.extractLoops(topLevelLines);
    if (functions.length === 0) {
      const scriptText = topLevelLines.map((l) => l.text).join('\n');
      const hasDivisionInBody =
        scriptText.includes('/ 2') ||
        scriptText.includes('/= 2') ||
        scriptText.includes('>> 1');

      functions.push({
        type: 'function',
        name: this.messages.mainScript,
        startLine: 1,
        endLine: lines.length,
        bodyText: scriptText,
        loops: mainLoops,
        recursiveCalls: [],
        hasDivisionInBody,
      });
    } else if (mainLoops.length > 0) {
      const scriptText = topLevelLines.map((l) => l.text).join('\n');
      const hasDivisionInBody =
        scriptText.includes('/ 2') ||
        scriptText.includes('/= 2') ||
        scriptText.includes('>> 1');

      const startLine = topLevelLines[0]?.line || 1;
      const endLine = topLevelLines[topLevelLines.length - 1]?.line || lines.length;

      functions.push({
        type: 'function',
        name: this.messages.mainScript,
        startLine,
        endLine,
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
      bodyLines: { line: number; text: string }[];
    },
    endLine: number
  ): UniversalFunctionNode {
    const bodyText = rawFn.bodyLines.map((l) => l.text).join('\n');
    const hasDivisionInBody =
      bodyText.includes('/ 2') ||
      bodyText.includes('/= 2') ||
      bodyText.includes('>> 1');

    const recursiveCalls: UniversalCallNode[] = [];
    const callRegex = new RegExp(`\\b${rawFn.name}\\s*\\(([^)]*)\\)|\\b${rawFn.name}\\b`, 'g');
    for (const bLine of rawFn.bodyLines) {
      const code = bLine.text.replace(/(['"]).*?\1/g, '').replace(/#.*$/, '');
      let match;
      while ((match = callRegex.exec(code)) !== null) {
        if (code.startsWith('def ')) continue;
        recursiveCalls.push({
          type: 'call',
          name: rawFn.name,
          line: bLine.line,
          argsText: match[1] || '',
        });
      }
    }

    const loops = this.extractLoops(rawFn.bodyLines);

    return {
      type: 'function',
      name: rawFn.name,
      startLine: rawFn.startLine,
      endLine,
      bodyText,
      loops,
      recursiveCalls,
      hasDivisionInBody,
    };
  }

  private extractLoops(lines: { line: number; text: string }[]): UniversalLoopNode[] {
    const topLoops: UniversalLoopNode[] = [];

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const isTimes = l.text.includes('.times') || l.text.includes('.each');
      const isFor = l.text.startsWith('for ');
      const isWhile = l.text.startsWith('while ');

      if (isTimes || isFor || isWhile) {
        let stepType: 'linear' | 'logarithmic' | 'sqrt' = 'linear';
        let explanation = this.messages.rubyLoopLinear;

        if (isWhile) {
          for (let j = i + 1; j < lines.length; j++) {
            const inner = lines[j].text;
            if (inner.includes('end')) break;
            if (inner.includes('/= 2') || inner.includes('/ 2') || inner.includes('>>= 1')) {
              stepType = 'logarithmic';
              explanation = this.messages.rubyWhileLog;
              break;
            }
          }
        }

        topLoops.push({
          type: 'loop',
          loopKind: isWhile ? 'while' : 'for',
          line: l.line,
          stepType,
          explanation,
          subLoops: [],
        });
      }
    }

    return topLoops;
  }
}
