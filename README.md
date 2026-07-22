# BigON - Analisador de Complexidade Assintótica para VS Code

[![Visual Studio Code](https://img.shields.io/badge/Visual%20Studio%20Code-3178C6?logo=visual-studio-code&logoColor=fff)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)](#)
[![License](https://img.shields.io/github/license/vncsmnl/BigON?branch=main&label=License&logo=GitHub&logoColor=ffffff&labelColor=282828&color=informational&style=flat)](https://github.com/vncsmnl/BigON/blob/main/LICENSE)

Extensão para **VS Code**, **VSCodium**, **Cursor**, **Antigravity** e afins que realiza análise de complexidade assintótica de Tempo `O(n)` e Espaço `O(1)` através da **Árvore Sintática Abstrata (AST)** do código-fonte, sem a necessidade de executar o programa.

<div align="center">
  <img src="./assets/logo.png" alt="logo" height="50%" width="50%">
</div>

<div align="center">
  <img src="./assets/code.png" alt="code">
</div>

<div align="center">
  <img src="./assets/webview.png" alt="webview">
</div>

---

## Funcionalidades Principais

- **Análise Estática via AST**: Identifica laços lineares (`i++`), laços logarítmicos (`i *= 2`, `n /= 2`), laços aninhados (`O(n²)`), recursão e alocação de memória.
- **Decorações In-line no Editor**: Destaca visualmente a complexidade no final das linhas de laços (ex: `← Custo: O(n)`).
- **CodeLens Interativo**: Exibe um cabeçalho clicável sobre cada função no código:
  `BigON: Tempo O(n²) | Espaço O(1) [Ver Explicação]`
- **Hover Informativo**: Passe o mouse sobre o nome de qualquer função para ver o resumo de tempo, espaço e justificativa.
- **Painel Webview Educacional**: Explicação passo a passo detalhando como a complexidade foi calculada com ícones profissionais e gráficos das curvas de crescimento Big-O.

---

## Padrões Reconhecidos

| Padrão de Código | Complexidade de Tempo | Explicação |
| ---------------- | --------------------- | ---------- |
| Um laço `for (let i = 0; i < n; i++)` | **`O(n)`** | Passo linear |
| Dois laços `for` aninhados | **`O(n²)`** | Multiplicação de custos `O(n) × O(n)` |
| Incremento multiplicativo (`i *= 2`) | **`O(log n)`** | Crescimento logarítmico |
| Divisão sucessiva (`n /= 2`) | **`O(log n)`** | Redução pela metade |
| Recursão simples `f(n/2)` | **`O(log n)`** | Busca Binária |
| Recursão `2 * f(n/2) + O(n)` | **`O(n log n)`** | Divisão e Conquista / Merge Sort |
| Recursão `f(n-1) + f(n-2)` | **`O(2ⁿ)`** | Árvore exponencial (Fibonacci) |
| Recursão com laço `for` interno | **`O(n!)`** | Permutações/Combinações |

---

## Como Executar e Testar Localmente

### 1. Instalar Dependências

```bash
npm install
```

### 2. Rodar os Testes Unitários de Análise AST

```bash
npm test
```

### 3. Compilar e Debugar no VS Code

1. Abra este projeto no VS Code.
2. Pressione `F5` (ou vá em **Run and Debug** -> **Launch Extension**).
3. Uma nova janela do VS Code (Extension Development Host) será aberta.
4. Abra qualquer arquivo JavaScript ou TypeScript e veja o CodeLens e anotações in-line funcionando!

---

## Comandos Disponíveis

- `BigON: Analisar Complexidade do Arquivo` (`BigON.analyzeFile`)
- `BigON: Alternar Anotações In-line` (`BigON.toggleDecorations`)
- `BigON: Abrir Painel de Explicação` (`BigON.openExplanation`)

---

## Limitações da Análise

A extensão **BigON** utiliza análise estática via AST (para JavaScript/TypeScript) e identificadores heurísticos sintáticos para Python, Ruby e C++. As estimativas representam diagnósticos estáticos baseados em padrões estruturais típicos de código e não constituem provas matemáticas formais. Códigos com compilação dinâmica, metaprogramação, comportamento dependente exclusivamente de dados de runtime ou recursão indireta complexa podem gerar estimativas aproximadas.

---

## Licença

MIT © Vinícius Manoel