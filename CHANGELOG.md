# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/spec/v2.0.0.html).

## [Unreleased]

## [1.0.5] - 2026-08-27

### Added
- **Suporte a Go e Java**: Adicionados parsers universais (`goUniversalParser`, `javaUniversalParser`) para análise heurística de complexidade em arquivos `.go` e `.java`, incluindo detecção de laços lineares/logarítmicos, métodos de classe/structs e recursão. Contribuição de [@felipersteles](https://github.com/felipersteles) via PR [#3](https://github.com/vncsmnl/BigON/pull/3). Resolve [vncsmnl/BigON#1](https://github.com/vncsmnl/BigON/issues/1).
- **Internacionalização Completa da Interface (i18n)**: UI do Webview, gráficos SVG, fundamentação teórica Cormen (CLRS), CodeLens, balões de hover e passos de raciocínio da AST agora são 100% dinâmicos e sincronizados com o idioma do VS Code (`en` como padrão e `pt-BR` para locales `pt-*`).

### Fixed
- **Isolamento de Análise por Bloco de Função**: Corrigida a sobreposição indevida do `<script principal>` que mascarava funções em nível de arquivo em linguagens com suporte universal. O comando de explicação agora resolve precisamente a função sob a posição do cursor.
- **Ativação e Decorações no VS Code para Go e Java**: Corrigido o filtro `isSupportedDocument` em `src/extension.ts` para que decorações e hovers sejam exibidos normalmente em arquivos `.go` e `.java`.

### Fixed
- **Ativação por comandos**: adicionados eventos `onCommand` para garantir que a extensão seja ativada ao executar qualquer comando pelo `.vsix`.

### Changed
- **Dependências de runtime revisadas**: `typescript` permanece em `dependencies`; ferramentas de teste e declarações de tipos continuam isoladas em `devDependencies`.

## [1.0.3] - 2026-08-22

### Added
- **Internacionalização da interface**: Inglês agora é o idioma padrão, com seleção automática de português para locales `pt-*` do VS Code.
- **Matriz ampliada de testes**: Adicionados cenários para funções arrow, métodos, laços independentes, `for...of`, `for...in`, `sqrt(n)`, espaço auxiliar, scripts vazios e parsers multi-idioma.
- **Documentação de desenvolvimento**: Incluído guia para adicionar suporte a novas linguagens e traduções da interface.

### Changed
- **Análise mais conservadora**: Limites de laços baseados em chamadas desconhecidas agora retornam `O(desconhecido)` em vez de assumir `O(n)`.
- **Simplificação interna**: Removidos wrappers e campos universais sem uso, além de compartilhada a instância do motor de análise na extensão.
- **Recursão em funções aninhadas**: A análise da função externa não incorpora laços ou chamadas recursivas de funções internas.

### Fixed
- **Falso positivo no parser Ruby**: Strings e comentários contendo o nome do método não são mais identificados como chamadas recursivas.
- **Detecção de funções aninhadas**: Laços e autochamadas agora permanecem associados à função correta.

## [1.0.2] - 2026-07-22

### Added
- **Webview de Explicação Aprimorado**: Implementado suporte visual no `ExplanationWebviewPanel` para exibir relatórios de complexidade com gráficos de curva de crescimento Big-O.
- **Configuração de Issues no GitHub**: Adicionada configuração de templates de issue para padronizar abertura e triagem no repositório.

### Changed
- **Documentação Técnica Expandida**: Adicionados os documentos `docs/ARCHITECTURE.md` e `docs/CONTRIBUTING.md`, além de ajustes de formatação e organização da documentação.
- **README Reestruturado**: Refatorado e ampliado com guias mais detalhados de instalação, uso e desenvolvimento.
- **Identidade Visual**: Atualizado o logotipo do projeto e ajustes de estilo relacionados.

### Fixed
- **Conflitos de Merge na Documentação**: Removidos marcadores de conflito (`<<<<<<<`, `=======`, `>>>>>>>`) no `README.md`.
- **Seções Duplicadas/Obsoletas no README**: Removidas instruções redundantes de instalação e conteúdos desatualizados.

## [1.0.1] - 2026-07-22

### Added
- **CI/CD Release Automatizado**: Adicionado workflow do GitHub Actions (`.github/workflows/release.yml`) para compilação, testes, empacotamento `.vsix` e criação de GitHub Releases automatizadas com extração de changelog via `awk`.

### Changed
- **Dependências & TypeScript**: Atualizado o TypeScript para a versão `v5.9.3` e reconfigurado o `tsconfig.json` base.
- **Gerenciamento de Pacotes**: Migração definitiva para o `npm`, atualizando o script `vscode:prepublish` e otimizando a árvore de dependências.
- **Configurações do Pacote**: Atualizado o arquivo `.vscodeignore` e registro de comandos no `package.json`.
- **Modelos e Recursos do Repositório**: Adicionados e atualizados modelos de Pull Requests e Issues no `.github/`, badges do VS Code e inclusão de assets de demonstração.

## [1.0.0] - 2026-07-22

### Added
- **Análise Estática via AST**: Análise de complexidade assintótica de Tempo (`O`) e Espaço (`O`) para JavaScript/TypeScript, Python, Ruby, C e C++.
- **Motor de Análise Asintótica**: Implementação dos componentes `ASTParser`, `ComplexityEngine`, `LoopAnalyzer`, `RecursionAnalyzer` e `SpaceAnalyzer`.
- **CodeLens Interativo**: `AsymptoticCodeLensProvider` exibindo cabeçalho clicável com a complexidade acima de funções e classes.
- **Decorações In-line**: `LineDecorationManager` para destaques visuais diretamente nas linhas de laços (ex: `← Custo: O(n)`).
- **Hover Informativo**: `AsymptoticHoverProvider` com balão explicativo detalhado ao passar o mouse sobre nomes de funções.
- **Painel Webview Educacional**: `ExplanationWebviewPanel` fornecendo explicações passo a passo do cálculo da complexidade com gráficos Big-O interativos e avisos de contexto.
- **Configurações Personalizadas**: Opções para ativar/desativar CodeLens, anotações in-line e hover via `settings.json`.
- **Suíte de Testes Unitários**: Testes cobrindo análise estática AST, suporte a múltiplas linguagens e nivelamento de scripts.
- **Documentação Inicial**: Criação do `README.md` com visão geral, imagens de demonstração, licença MIT e changelog inicial.

[Unreleased]: https://github.com/vncsmnl/BigON/compare/v1.0.4...HEAD
[1.0.4]: https://github.com/vncsmnl/BigON/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/vncsmnl/BigON/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/vncsmnl/BigON/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/vncsmnl/BigON/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/vncsmnl/BigON/releases/tag/v1.0.0
