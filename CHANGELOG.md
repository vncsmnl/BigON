# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-07-22

### Added
- **Análise Estática via AST**: Análise de complexidade assintótica de Tempo ($O$) e Espaço ($O$) para JavaScript/TypeScript, Python, Ruby, C e C++.
- **CodeLens Interativo**: Cabeçalho clicável exibindo complexidade acima de funções e classes.
- **Decorações In-line**: Destaques visuais diretamente nas linhas de laços (ex: `← Custo: O(n)`).
- **Hover Informativo**: Detalhamento ao passar o mouse sobre nomes de funções.
- **Painel Webview Educacional**: Explicação passo a passo do cálculo da complexidade com gráficos Big-O interativos.
- **Configurações Personalizadas**: Opções para ativar/desativar CodeLens, anotações in-line e hover via `settings.json`.

### Changed
- **Otimização de Performance**: Otimização na análise de complexidade para suportar arquivos maiores e melhorar a precisão da análise.
- **Melhorias na Experiência do Usuário (UX)**: Melhorias na interface do usuário e experiência do usuário.

[Unreleased]: https://github.com/vncsmnl/BigON/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/vncsmnl/BigON/releases/tag/v1.0.0
