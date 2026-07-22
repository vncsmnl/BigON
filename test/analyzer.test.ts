import { ComplexityEngine } from '../src/analyzer/complexityEngine';

describe('ComplexityEngine - Static AST Analysis', () => {
  let engine: ComplexityEngine;

  beforeEach(() => {
    engine = new ComplexityEngine();
  });

  test('deve identificar complexidade O(n) em um laço simples', () => {
    const code = `
      function buscaLinear(arr, n) {
        for (let i = 0; i < n; i++) {
          if (arr[i] === 42) return i;
        }
        return -1;
      }
    `;
    const result = engine.analyzeCode(code);
    expect(result.functions).toHaveLength(1);
    expect(result.functions[0].timeComplexity).toBe('O(n)');
    expect(result.functions[0].spaceComplexity).toBe('O(1)');
  });

  test('deve identificar complexidade O(n²) em dois laços aninhados (Bubble Sort)', () => {
    const code = `
      function bubbleSort(arr, n) {
        for (let i = 0; i < n; i++) {
          for (let j = 0; j < n; j++) {
            if (arr[i] < arr[j]) {
              let temp = arr[i];
              arr[i] = arr[j];
              arr[j] = temp;
            }
          }
        }
      }
    `;
    const result = engine.analyzeCode(code);
    expect(result.functions[0].timeComplexity).toBe('O(n^2)');
    expect(result.functions[0].annotations).toHaveLength(2);
  });

  test('deve identificar complexidade O(log n) em um laço com n /= 2', () => {
    const code = `
      function divisaoSucessiva(n) {
        let passos = 0;
        while (n > 1) {
          n /= 2;
          passos++;
        }
        return passos;
      }
    `;
    const result = engine.analyzeCode(code);
    expect(result.functions[0].timeComplexity).toBe('O(log n)');
  });

  test('deve identificar complexidade O(log n) em recursão de busca binária', () => {
    const code = `
      function buscaBinaria(arr, target, start, end) {
        if (start > end) return -1;
        let mid = Math.floor((start + end) / 2);
        if (arr[mid] === target) return mid;
        if (arr[mid] > target) {
          return buscaBinaria(arr, target, start, mid - 1);
        }
        return buscaBinaria(arr, target, mid + 1, end);
      }
    `;
    const result = engine.analyzeCode(code);
    expect(result.functions[0].isRecursive).toBe(true);
    expect(result.functions[0].timeComplexity).toBe('O(log n)');
    expect(result.functions[0].spaceComplexity).toBe('O(log n)');
  });

  test('deve identificar complexidade O(2^n) em recursão ingênua de Fibonacci', () => {
    const code = `
      function fibonacci(n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
      }
    `;
    const result = engine.analyzeCode(code);
    expect(result.functions[0].isRecursive).toBe(true);
    expect(result.functions[0].timeComplexity).toBe('O(2^n)');
    expect(result.functions[0].spaceComplexity).toBe('O(n)');
  });

  test('deve identificar complexidade O(n²) em recursão simples com laço linear T(n) = T(n-1) + O(n)', () => {
    const code = `
      function selectionSortRecursivo(arr, n) {
        if (n <= 1) return;
        for (let i = 0; i < n; i++) {
          if (arr[i] > arr[n - 1]) {
            let temp = arr[i];
            arr[i] = arr[n - 1];
            arr[n - 1] = temp;
          }
        }
        selectionSortRecursivo(arr, n - 1);
      }
    `;
    const result = engine.analyzeCode(code);
    expect(result.functions[0].isRecursive).toBe(true);
    expect(result.functions[0].timeComplexity).toBe('O(n^2)');
  });

  test('deve identificar complexidade O(n^4) em 4 laços aninhados', () => {
    const code = `
      function quatroLacos(n) {
        for (let a = 0; a < n; a++) {
          for (let b = 0; b < n; b++) {
            for (let c = 0; c < n; c++) {
              for (let d = 0; d < n; d++) {
                console.log(a + b + c + d);
              }
            }
          }
        }
      }
    `;
    const result = engine.analyzeCode(code);
    expect(result.functions[0].timeComplexity).toBe('O(n^4)');
  });

  test('deve identificar complexidade O(n log n) em laço linear contendo laço logarítmico', () => {
    const code = `
      function laçoNLogN(n) {
        for (let i = 0; i < n; i++) {
          let j = n;
          while (j > 1) {
            j = Math.floor(j / 2);
          }
        }
      }
    `;
    const result = engine.analyzeCode(code);
    expect(result.functions[0].timeComplexity).toBe('O(n log n)');
    expect(result.functions[0].annotations[0].cost).toBe('O(n log n)');
  });
});
