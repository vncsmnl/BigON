/**
 * Tipos e Interfaces para o Motor de Análise Assintótica
 */

export type BigOComplexity =
  | 'O(1)'
  | 'O(log n)'
  | 'O(sqrt n)'
  | 'O(n)'
  | 'O(n log n)'
  | 'O(n^2)'
  | 'O(n^3)'
  | 'O(n^4)'
  | 'O(2^n)'
  | 'O(n!)'
  | 'O(desconhecido)';

export interface LineAnnotation {
  line: number;
  cost: BigOComplexity;
  label: string;
  explanation: string;
}

export interface ReasoningStep {
  type: 'loop' | 'recursion' | 'space' | 'summary';
  title: string;
  detail: string;
  complexity: BigOComplexity;
  lineRange?: { start: number; end: number };
}

export interface FunctionComplexityReport {
  functionName: string;
  startLine: number;
  endLine: number;
  timeComplexity: BigOComplexity;
  spaceComplexity: BigOComplexity;
  annotations: LineAnnotation[];
  reasoningSteps: ReasoningStep[];
  isRecursive: boolean;
}

export interface FileAnalysisResult {
  filePath: string;
  functions: FunctionComplexityReport[];
}
