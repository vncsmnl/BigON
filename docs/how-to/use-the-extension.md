# Usar a extensão no editor

O BigON analisa arquivos suportados enquanto você trabalha e apresenta os resultados em CodeLens, anotações inline e hover.

## Executar uma análise

Abra a paleta de comandos e execute `BigON: Analisar Complexidade do Arquivo`. O comando corresponde ao ID `BigON.analyzeFile`.

## Consultar a explicação

Use `BigON: Abrir Painel de Explicação` para abrir o painel Webview da função analisada. O CodeLens também oferece o acesso `Ver Explicação`.

## Alternar anotações inline

Execute `BigON: Alternar Anotações In-line` para alternar as marcações de custo nas linhas de laços.

## Ajustar a apresentação

Nas configurações do editor, altere `BigON.enableCodeLens`, `BigON.enableInlineDecorations` ou `BigON.enableHover`. As três opções são booleanas e têm valor padrão `true`.

_Verified against `main`@`207db84` on 2026-08-27._
