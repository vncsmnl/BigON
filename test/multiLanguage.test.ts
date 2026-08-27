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

  describe('Go (.go)', () => {
    test('deve identificar O(n) em laço for simples em Go', () => {
      const code = `
func buscaLinear(arr []int, n int) int {
    for i := 0; i < n; i++ {
        if arr[i] == 42 {
            return i
        }
    }
    return -1
}
      `;
      const result = engine.analyzeCode(code, 'file.go', 'go');
      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].functionName).toBe('buscaLinear');
      expect(result.functions[0].timeComplexity).toBe('O(n)');
    });

    test('deve identificar O(n^2) em laços aninhados em Go', () => {
      const code = `
func bubbleSort(arr []int, n int) {
    for i := 0; i < n; i++ {
        for j := 0; j < n; j++ {
            if arr[i] < arr[j] {
                arr[i], arr[j] = arr[j], arr[i]
            }
        }
    }
}
      `;
      const result = engine.analyzeCode(code, 'file.go', 'go');
      expect(result.functions[0].timeComplexity).toBe('O(n^2)');
    });

    test('deve identificar O(log n) em laço com i *= 2 em Go', () => {
      const code = `
func loopLogaritmico(n int) int {
    cont := 0
    for i := 1; i < n; i *= 2 {
        cont++
    }
    return cont
}
      `;
      const result = engine.analyzeCode(code, 'file.go', 'go');
      expect(result.functions[0].timeComplexity).toBe('O(log n)');
    });

    test('deve identificar métodos com struct receiver e recursão O(log n) em Go', () => {
      const code = `
type Searcher struct {}

func (s *Searcher) BinarySearch(arr []int, target int, low int, high int) int {
    if low > high {
        return -1
    }
    mid := (low + high) / 2
    if arr[mid] == target {
        return mid
    }
    if arr[mid] > target {
        return s.BinarySearch(arr, target, low, mid-1)
    }
    return s.BinarySearch(arr, target, mid+1, high)
}
      `;
      const result = engine.analyzeCode(code, 'search.go', 'go', 'en');
      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].functionName).toBe('BinarySearch');
      expect(result.functions[0].isRecursive).toBe(true);
      expect(result.functions[0].timeComplexity).toBe('O(log n)');
    });

    test('deve identificar recursão O(2^n) em Fibonacci Go', () => {
      const code = `
func fib(n int) int {
    if n <= 1 {
        return n
    }
    return fib(n-1) + fib(n-2)
}
      `;
      const result = engine.analyzeCode(code, 'fib.go', 'go', 'pt-BR');
      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].functionName).toBe('fib');
      expect(result.functions[0].timeComplexity).toBe('O(2^n)');
    });
  });

  describe('Java (.java)', () => {
    test('deve identificar O(n) em laço for simples em Java', () => {
      const code = `
public int buscaLinear(int[] arr, int n) {
    for (int i = 0; i < n; i++) {
        if (arr[i] == 42) {
            return i;
        }
    }
    return -1;
}
      `;
      const result = engine.analyzeCode(code, 'file.java', 'java');
      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].functionName).toBe('buscaLinear');
      expect(result.functions[0].timeComplexity).toBe('O(n)');
    });

    test('deve identificar O(n^2) em laços aninhados em Java', () => {
      const code = `
public void bubbleSort(int[] arr, int n) {
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
      const result = engine.analyzeCode(code, 'file.java', 'java');
      expect(result.functions[0].timeComplexity).toBe('O(n^2)');
    });

    test('deve identificar O(log n) em laço while dividindo por constante em Java', () => {
      const code = `
public int divisaoSucessiva(int n) {
    int passos = 0;
    while (n > 1) {
        n /= 2;
        passos++;
    }
    return passos;
}
      `;
      const result = engine.analyzeCode(code, 'file.java', 'java');
      expect(result.functions[0].timeComplexity).toBe('O(log n)');
    });

    test('deve identificar recursão em métodos de classe Java com this e anotações', () => {
      const code = `
public class Sorter {
    @Override
    public int binarySearch(int[] arr, int target, int low, int high) {
        if (low > high) return -1;
        int mid = (low + high) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] > target) {
            return this.binarySearch(arr, target, low, mid - 1);
        }
        return this.binarySearch(arr, target, mid + 1, high);
    }
}
      `;
      const result = engine.analyzeCode(code, 'Sorter.java', 'java', 'en');
      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].functionName).toBe('binarySearch');
      expect(result.functions[0].isRecursive).toBe(true);
      expect(result.functions[0].timeComplexity).toBe('O(log n)');
    });
  });
});
