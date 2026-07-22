/**
 * Tipos e Interfaces para a AST Universal (Multi-Linguagem)
 */
export type UniversalNodeType = 'function' | 'loop' | 'if' | 'call' | 'statement';

export interface UniversalLoopNode {
  type: 'loop';
  loopKind: 'for' | 'while' | 'times' | 'each';
  line: number;
  stepType: 'linear' | 'logarithmic' | 'sqrt';
  explanation: string;
  subLoops: UniversalLoopNode[];
}

export interface UniversalCallNode {
  type: 'call';
  name: string;
  line: number;
  argsText: string;
}

export interface UniversalFunctionNode {
  type: 'function';
  name: string;
  startLine: number;
  endLine: number;
  parameters: string[];
  bodyText: string;
  loops: UniversalLoopNode[];
  recursiveCalls: UniversalCallNode[];
  hasDivisionInBody: boolean;
}

export interface UniversalFileAST {
  languageId: string;
  functions: UniversalFunctionNode[];
}
