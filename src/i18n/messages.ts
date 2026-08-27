export interface Messages {
  htmlLang: string;
  webviewTitle: string;
  analysis: string;
  complexity: string;
  time: string;
  space: string;
  reasons: string;
  asymptoticComplexity: string;
  cost: string;
  analysisCompleted: string;
  decorationsOn: string;
  decorationsOff: string;
  noFunction: string;
  functionLabel: string;
  functionAnalysis: string;
  growthChart: string;
  theory: string;
  reasoningSteps: string;
  lineAnnotations: string;
  location: string;
  explanation: string;
  viewExplanation: string;
  excellent: string;
  good: string;
  acceptable: string;
  poor: string;
  terrible: string;
  variable: string;

  // Chart & Curves
  axisLabelInput: string;
  axisLabelOps: string;
  growthCurvesTitle: string;
  growthCurvesSubtitle: string;
  scaleTitle: string;

  constantClass: string;
  constantDesc: string;
  logarithmicClass: string;
  logarithmicDesc: string;
  linearClass: string;
  linearDesc: string;
  linearithmicClass: string;
  linearithmicDesc: string;
  quadraticClass: string;
  quadraticDesc: string;
  exponentialClass: string;
  exponentialDesc: string;
  factorialClass: string;
  factorialDesc: string;

  // Theory Tab (CLRS)
  whatIsBigOTitle: string;
  whatIsBigODesc: string;
  formalDefTitle: string;
  formalDefFormula: string;
  formalDefExplanation: string;
  citationRef: string;
  timeVsSpaceTitle: string;
  timeVsSpaceIntro: string;
  timeComplexityDesc: string;
  spaceComplexityDesc: string;
  tradeoffNote: string;
  technicalDisclaimer: string;

  // Engine & Analyzer strings
  loopLinear: string;
  loopStructure: string;
  loopMultStep: (inc: string) => string;
  loopMultBody: string;
  loopSqrtBound: (cond: string) => string;
  loopUnknownBound: (cond: string) => string;
  loopForLinear: string;
  loopWhileLog: string;
  loopWhileSqrt: string;
  loopWhileLinear: string;
  outerLoop: string;
  innerLoop: string;
  loopLevel: (level: number) => string;
  nestedLoopsMultiplication: string;
  nestedLoopsMultDetail: (outer: string, inner: string, combined: string) => string;
  nestedLoopsWithInner: (combined: string) => string;

  recursionNone: string;
  recursionSelfCallNone: string;
  recursionBinarySearch: string;
  recursionInsideLoop: string;
  recursionSelectionSort: string;
  recursionQuadraticLoop: string;
  recursionLinear: string;
  masterTheoremMergeSort: (calls: number) => string;
  masterTheoremTree: (calls: number) => string;
  recursionFibonacci: string;
  recursionMultiBranch: string;
  recursionTitle: string;
  recursionTitleNamed: (fn: string) => string;
  recursionLabel: (cost: string) => string;
  recursionCallExplanation: (fn: string) => string;
  recursionDetailNamed: (calls: number, fn: string, isFactorial: boolean) => string;

  permutationTitle: string;
  permutationDetail: string;
  permutationLabel: string;
  permutationExplanation: string;

  spaceConstant: string;
  spaceStackLog: string;
  spaceStackLinear: string;
  spaceMatrix: string;
  spaceVector: string;
  spaceTitle: string;
  spaceStackDetail: (cost: string) => string;
  spacePermutationDetail: string;

  summaryFinalResult: string;
  summaryTimeSpace: (time: string, space: string) => string;

  pythonLoopLinear: string;
  pythonWhileLog: string;
  pythonWhileVar: string;
  rubyLoopLinear: string;
  rubyWhileLog: string;
  cppLoopLinear: string;
  cppLoopLog: string;
  cppWhileLog: string;
  mainScript: string;
  nestedLoopsMultiLang: string;
}
