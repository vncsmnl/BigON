# Documentação Técnica do BigON

Bem-vindo à documentação técnica do **BigON**, a extensão de análise assintótica de tempo e espaço para **Visual Studio Code**, **VSCodium**, **Cursor**, **Antigravity** e editores compatíveis.

Aqui você encontrará materiais detalhados para entender como a extensão funciona internamente, como configurar seu ambiente de desenvolvimento e como contribuir com código, novas linguagens ou regras de análise.

---

## 📚 Índice da Documentação

| Documento | Descrição |
| :--- | :--- |
| 🛠️ **[Guia de Contribuição (`CONTRIBUTING.md`)](file:///d:/Documents/Projetos/Typescript/BigON/docs/CONTRIBUTING.md)** | Instruções de setup, execução local, testes, padrões de código e **passo a passo para adicionar suporte a novas linguagens** ou **regras de análise assintótica**. |
| 🏗️ **[Arquitetura do Sistema (`ARCHITECTURE.md`)](file:///d:/Documents/Projetos/Typescript/BigON/docs/ARCHITECTURE.md)** | Visão profunda sobre o motor de análise AST (`ComplexityEngine`), parsers sintáticos universais, pipeline de cálculo Big-O e integração com a interface do VS Code (CodeLens, Hover, LineDecorations, Webview). |

---

## 🚀 Início Rápido para Desenvolvedores

```bash
# 1. Clonar o repositório
git clone https://github.com/vncsmnl/BigON.git
cd BigON

# 2. Instalar dependências
npm install

# 3. Executar os testes unitários do motor de análise
npm test

# 4. Compilar o projeto
npm run compile
```

Para debugar a extensão no VS Code:
1. Abra a pasta do projeto no VS Code.
2. Pressione `F5` para iniciar o **Extension Development Host**.
3. Na janela em modo de desenvolvimento, abra um arquivo `.ts`, `.js`, `.py`, `.rb` ou `.cpp` para ver as análises em tempo real.

---

## 🤝 Dúvidas ou Sugestões?

Se você encontrar um bug ou tiver ideias para novas regras de análise e suporte a outras linguagens, abra uma issue no nosso repositório no GitHub:
👉 [GitHub Issues - BigON](https://github.com/vncsmnl/BigON/issues)
