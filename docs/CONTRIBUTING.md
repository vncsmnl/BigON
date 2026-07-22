# Guia de Contribuição para Desenvolvedores - BigON

Ficamos muito felizes pelo seu interesse em contribuir para o **BigON**! Este guia contém todas as informações necessárias para configurar seu ambiente de desenvolvimento, compreender a organização do código, executar testes e submeter novas funcionalidades ou correções de bugs.

---

## 📋 Sumário

1. [Pré-requisitos](#-pré-requisitos)
2. [Configuração do Ambiente de Desenvolvimento](#-configuração-do-ambiente-de-desenvolvimento)
3. [Estrutura de Diretórios](#-estrutura-de-diretórios)
4. [Como Executar e Testar Localmente](#-como-executar-e-testar-localmente)
5. [Como Adicionar Suporte a uma Nova Linguagem](#-como-adicionar-suporte-a-uma-nova-linguagem)
6. [Como Adicionar ou Ajustar Regras de Análise Assintótica](#-como-adicionar-ou-ajustar-regras-de-análise-assintótica)
7. [Diretrizes de Testes Unitários](#-diretrizes-de-testes-unitários)
8. [Padrões de Código e Submissão de PR](#-padrões-de-código-e-submissão-de-pr)

---

## 🛠️ Pré-requisitos

Antes de iniciar, certifique-se de ter instalado em sua máquina:

- **[Node.js](https://nodejs.org/)**: Versão `18.x` ou superior (recomendado `20.x+`).
- **[npm](https://www.npmjs.com/)**: Gerenciador de pacotes (geralmente incluso no Node.js).
- **[VS Code](https://code.visualstudio.com/)**, **VSCodium**, **Cursor** ou **Antigravity**: Para edição do código e depuração via Extension Host.
- **Git**: Controle de versão.

---

## 🚀 Configuração do Ambiente de Desenvolvimento

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/vncsmnl/BigON.git
   cd BigON
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Verifique a compilação do TypeScript:**
   ```bash
   npm run compile
   ```

---

## 📁 Estrutura de Diretórios

A estrutura do projeto está organizada de forma modular entre o **motor de análise estatística/AST** e a **interface do VS Code**:

```text
BigON/
├── assets/                  # Ícones, logo e capturas de tela para documentação
├── docs/                    # Documentação técnica do desenvolvedor (você está aqui!)
├── src/
│   ├── extension.ts         # Ponto de entrada da extensão VS Code (ativação, eventos e comandos)
│   ├── analyzer/            # Motor de Análise Assintótica Big-O
│   │   ├── types.ts         # Definições de tipos (BigOComplexity, FunctionComplexityReport, etc.)
│   │   ├── astParser.ts     # Parser da AST oficial para TypeScript / JavaScript
│   │   ├── complexityEngine.ts # Orquestrador principal da análise de complexidade
│   │   ├── loopAnalyzer.ts  # Análise de laços (incrementos, multiplicações, aninhamentos)
│   │   ├── recursionAnalyzer.ts # Identificação de chamadas recursivas e equações de recorrência
│   │   ├── spaceAnalyzer.ts # Análise de alocação de memória auxiliar
│   │   └── universal/       # Parsers sintáticos universais para linguagens sem AST nativa no TS
│   │       ├── types.ts     # Tipos para a AST universal (UniversalFunctionNode, etc.)
│   │       ├── universalParserRouter.ts # Roteador de linguagem
│   │       └── parsers/     # Parsers sintáticos específicos (Python, Ruby, C++)
│   └── ui/                  # Componentes de Interface de Usuário no VS Code
│       ├── codeLensProvider.ts # Exibição de cabeçalhos sobre funções no editor
│       ├── hoverProvider.ts    # Tooltip com resumo ao passar o mouse sobre a função
│       ├── lineDecorations.ts  # Anotações in-line de custo Big-O ao lado do código
│       └── webviewPanel.ts     # Painel educacional interativo com gráficos Big-O
└── test/                    # Suíte de testes unitários com Jest
    ├── analyzer.test.ts      # Testes do motor AST (JavaScript/TypeScript)
    ├── multiLanguage.test.ts # Testes para parsers universais (Python, Ruby, C++)
    └── scriptLevel.test.ts    # Testes para scripts fora de escopos de função
```

---

## 🧪 Como Executar e Testar Localmente

### Rodando a Suíte de Testes
Utilizamos **[Jest](https://jestjs.io/)** com **`ts-jest`** para os testes unitários do motor de análise:

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch (recompila ao alterar arquivos)
npx jest --watch
```

### Debugando a Extensão no VS Code
1. Abra a pasta do projeto no VS Code.
2. Pressione `F5` (ou clique na aba **Run and Debug** e selecione **Launch Extension**).
3. Uma nova janela do VS Code chamada **[Extension Development Host]** se abrirá.
4. Na janela de desenvolvimento, abra ou crie qualquer arquivo `.js`, `.ts`, `.py`, `.rb` ou `.cpp`.
5. Observe o **CodeLens** sobre as funções, as **decorações in-line** de custo nas linhas e clique em `[Ver Explicação]` para abrir o Webview interativo.

---

## 🌐 Como Adicionar Suporte a uma Nova Linguagem

O BigON suporta tanto análise via AST nativa (para JS/TS usando a TypeScript Compiler API) quanto parsers sintáticos heurísticos universais para linguagens adicionais (ex: Python, Ruby, C++).

Para adicionar suporte a uma nova linguagem (por exemplo, **Go** ou **Java**):

### Passo 1: Criar o Parser em `src/analyzer/universal/parsers/`
Crie um novo arquivo, ex: `src/analyzer/universal/parsers/goUniversalParser.ts`, implementando a varredura das funções e estruturas de laços/recursão:

```typescript
import { UniversalFunctionNode, UniversalLoopNode } from '../types';

export class GoUniversalParser {
  public parse(code: string): UniversalFunctionNode[] {
    const functions: UniversalFunctionNode[] = [];
    // 1. Identificar assinaturas de função (ex: func nome() { ... })
    // 2. Extrair laços (for i := 0; i < n; i++)
    // 3. Detectar chamadas recursivas e alocações de memória
    return functions;
  }
}
```

### Passo 2: Registrar no Roteador `universalParserRouter.ts`
Em [src/analyzer/universal/universalParserRouter.ts](file:///d:/Documents/Projetos/Typescript/BigON/src/analyzer/universal/universalParserRouter.ts):
1. Importe seu parser.
2. Atualize a função `normalizeLanguageId`:
   ```typescript
   if (lang === 'go' || ext === 'go') return 'go';
   ```
3. Instancie o parser na classe `UniversalParserRouter` e adicione o `if/else` correspondente no método `parse()`.

### Passo 3: Registrar Eventos no `package.json` e `src/extension.ts`
1. Em `package.json`, adicione o id da linguagem em `activationEvents`:
   ```json
   "activationEvents": [
     "onLanguage:javascript",
     "onLanguage:typescript",
     "onLanguage:python",
     "onLanguage:ruby",
     "onLanguage:cpp",
     "onLanguage:go"
   ]
   ```
2. Em [src/extension.ts](file:///d:/Documents/Projetos/Typescript/BigON/src/extension.ts), inclua o id da linguagem na função `isSupportedDocument`:
   ```typescript
   return ['javascript', 'typescript', 'python', 'ruby', 'cpp', 'go'].includes(norm);
   ```

### Passo 4: Criar Testes Unitários
Adicione casos de teste para a nova linguagem em `test/multiLanguage.test.ts` testando cenários de $O(1)$, $O(n)$, $O(n^2)$, $O(\log n)$ e recursão.

---

## 🧮 Como Adicionar ou Ajustar Regras de Análise Assintótica

As regras de inferência matemática e análise assintótica ficam em `src/analyzer/`:

- **Análise de Laços (`loopAnalyzer.ts`)**:
  - Avalia o passo de incremento ou modificação da variável de controle (`i++`, `i += 2`, `i *= 2`, `n /= 2`, `i * i < n`).
  - Para adicionar detecção de um novo tipo de laço ou progressão (ex: progressão geométrica customizada), edite `LoopAnalyzer.analyzeLoop()`.

- **Análise de Recursão (`recursionAnalyzer.ts`)**:
  - Avalia a quantidade de chamadas autorreferenciais e o fator de redução do argumento ($n-1$, $n/2$).
  - Aplica regras inspiradas no **Teorema Mestre** e equações de recorrência ($O(\log n)$, $O(n \log n)$, $O(2^n)$, $O(n!)$).

- **Análise de Espaço (`spaceAnalyzer.ts`)**:
  - Identifica alocação de novos arrays/listas/matrizes em relação ao tamanho da entrada $n$.

---

## 📐 Diretrizes de Testes Unitários

Todos os PRs devem conter testes unitários cobrindo o código novo ou alterado.

Exemplo de teste unitário (`test/analyzer.test.ts`):

```typescript
import { ComplexityEngine } from '../src/analyzer/complexityEngine';

describe('Novo Cenário de Complexidade', () => {
  const engine = new ComplexityEngine();

  it('deve identificar corretamente O(log n) em busca binária', () => {
    const code = `
      function binarySearch(arr, target) {
        let low = 0, high = arr.length - 1;
        while (low <= high) {
          let mid = Math.floor((low + high) / 2);
          if (arr[mid] === target) return mid;
          if (arr[mid] < target) low = mid + 1;
          else high = mid - 1;
        }
        return -1;
      }
    `;
    const result = engine.analyzeCode(code, 'test.js', 'javascript');
    expect(result.functions[0].timeComplexity).toBe('O(log n)');
  });
});
```

---

## 📝 Padrões de Código e Submissão de PR

1. **Formatação e Estilo**:
   - Utilize TypeScript estrito (`strict: true` no `tsconfig.json`).
   - Mantenha comentários descritivos e JSDoc em novas classes e funções exported.
   - Use nomes de variáveis claros e semânticos.

2. **Commit e Pull Request**:
   - Faça commits atômicos com mensagens claras (ex: `feat: adiciona parser para Go`, `fix: corrige cálculo de laço com i *= 3`).
   - Certifique-se de que `npm test` e `npm run compile` executem com **sucesso zero erros** antes de abrir a PR.
   - Abra a Pull Request descrevendo claramente o que foi alterado e como testar.

Obrigado por ajudar a tornar o **BigON** cada vez melhor! 🚀
