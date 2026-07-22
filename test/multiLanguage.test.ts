import { ComplexityEngine } from '../src/analyzer/complexityEngine';

describe('ComplexityEngine - Multi-Language AST Analysis', () => {
  let engine: ComplexityEngine;

  beforeEach(() => {
    engine = new ComplexityEngine();
  });

  describe('JavaScript / TypeScript', () => {
    test('deve identificar complexidade O(n) em um laço simples JS', () => {
      const code = `
        function buscaLinear(arr, n) {
          for (let i = 0; i < n; i++) {
            if (arr[i] === 42) return i;
          }
          return -1;
        }
      `;
      const result = engine.analyzeCode(code, 'file.js', 'javascript');
      expect(result.functions[0].timeComplexity).toBe('O(n)');
    });
  });

  describe('Python (.py)', () => {
    test('deve identificar O(n) em laço for com range() em Python', () => {
      const code = `
def processar_lista(arr, n):
    for i in range(n):
        print(arr[i])
      `;
      const result = engine.analyzeCode(code, 'file.py', 'python');
      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].functionName).toBe('processar_lista');
      expect(result.functions[0].timeComplexity).toBe('O(n)');
    });

    test('deve identificar O(log n) em laço while com n //= 2 em Python', () => {
      const code = `
def divisao_sucessiva(n):
    passos = 0
    while n > 1:
        n //= 2
        passos += 1
    return passos
      `;
      const result = engine.analyzeCode(code, 'file.py', 'python');
      expect(result.functions[0].timeComplexity).toBe('O(log n)');
    });

    test('deve identificar O(2^n) em Fibonacci recursivo em Python', () => {
      const code = `
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)
      `;
      const result = engine.analyzeCode(code, 'file.py', 'python');
      expect(result.functions[0].isRecursive).toBe(true);
      expect(result.functions[0].timeComplexity).toBe('O(2^n)');
    });

    test('deve identificar O(n!) em todas_ordens com permutations() em Python', () => {
      const code = `
from itertools import permutations

def todas_ordens(lista):
    return list(permutations(lista))
      `;
      const result = engine.analyzeCode(code, 'file.py', 'python');
      expect(result.functions[0].functionName).toBe('todas_ordens');
      expect(result.functions[0].timeComplexity).toBe('O(n!)');
    });

    test('deve identificar O(n!) em permutação recursiva com laço em Python', () => {
      const code = `
def permutar(arr, i=0):
    if i == len(arr):
        print(arr)
    for j in range(i, len(arr)):
        arr[i], arr[j] = arr[j], arr[i]
        permutar(arr, i + 1)
        arr[i], arr[j] = arr[j], arr[i]
      `;
      const result = engine.analyzeCode(code, 'file.py', 'python');
      expect(result.functions[0].timeComplexity).toBe('O(n!)');
    });
  });

  describe('Ruby (.rb)', () => {
    test('deve identificar O(n) em n.times do em Ruby', () => {
      const code = `
def iterar_elementos(n)
  n.times do |i|
    puts i
  end
end
      `;
      const result = engine.analyzeCode(code, 'file.rb', 'ruby');
      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].functionName).toBe('iterar_elementos');
      expect(result.functions[0].timeComplexity).toBe('O(n)');
    });

    test('deve identificar O(log n) em while n > 1 com n /= 2 em Ruby', () => {
      const code = `
def divisao_ruby(n)
  while n > 1 do
    n /= 2
  end
end
      `;
      const result = engine.analyzeCode(code, 'file.rb', 'ruby');
      expect(result.functions[0].timeComplexity).toBe('O(log n)');
    });
  });

  describe('C++ (.cpp)', () => {
    test('deve identificar O(n²) em dois laços aninhados em C++', () => {
      const code = `
void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            if (arr[i] < arr[j]) {
                int temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
            }
        }
    }
}
      `;
      const result = engine.analyzeCode(code, 'file.cpp', 'cpp');
      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].functionName).toBe('bubbleSort');
      expect(result.functions[0].timeComplexity).toBe('O(n^2)');
    });

    test('deve identificar O(log n) em laço com i *= 2 em C++', () => {
      const code = `
int loopLogaritmico(int n) {
    int cont = 0;
    for (int i = 1; i < n; i *= 2) {
        cont++;
    }
    return cont;
}
      `;
      const result = engine.analyzeCode(code, 'file.cpp', 'cpp');
      expect(result.functions[0].timeComplexity).toBe('O(log n)');
    });

    test('deve identificar O(n!) em std::next_permutation em C++', () => {
      const code = `
void gerarPermutacoes(std::vector<int>& v) {
    while (std::next_permutation(v.begin(), v.end())) {
        // ...
    }
}
      `;
      const result = engine.analyzeCode(code, 'file.cpp', 'cpp');
      expect(result.functions[0].timeComplexity).toBe('O(n!)');
    });
  });
});
