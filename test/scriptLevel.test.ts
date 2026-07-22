import { ComplexityEngine } from '../src/analyzer/complexityEngine';

describe('ComplexityEngine - Script Level Analysis (No def / main functions)', () => {
  let engine: ComplexityEngine;

  beforeEach(() => {
    engine = new ComplexityEngine();
  });

  test('deve analisar script Python sem função def (CAT.py com 3 laços aninhados -> O(n³))', () => {
    const code = `
MOD = 1000000

for i in range(len(s) + 1):
    dp[(i, i - 1)] = 1

for length in range(2, len(s) + 1, 2):
    for left in range(len(s) - length + 1):
        right = left + length - 1
        total = 0

        for mid in range(left + 1, right + 1, 2):
            total += 1
    `;
    const result = engine.analyzeCode(code, 'CAT.py', 'python');
    expect(result.functions.length).toBeGreaterThan(0);
    const mainReport = result.functions.find((f) => f.functionName === '<script principal>');
    expect(mainReport).toBeDefined();
    expect(mainReport?.timeComplexity).toBe('O(n^3)');
  });
});
