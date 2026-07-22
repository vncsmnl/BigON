import * as vscode from 'vscode';
import { FunctionComplexityReport } from '../analyzer/types';

const COMPLEXITY_SCALE = [
  'O(1)',
  'O(log n)',
  'O(n)',
  'O(n log n)',
  'O(n²)',
  'O(n³)',
  'O(n⁴)',
  'O(2^n)',
  'O(n!)'
];

export class ExplanationWebviewPanel {
  public static currentPanel: ExplanationWebviewPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, report: FunctionComplexityReport) {
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this.update(report);
  }

  public static show(extensionUri: vscode.Uri, report: FunctionComplexityReport): void {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (ExplanationWebviewPanel.currentPanel) {
      ExplanationWebviewPanel.currentPanel._panel.reveal(column);
      ExplanationWebviewPanel.currentPanel.update(report);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'asymptoticExplanation',
      `${report.functionName} · complexidade`,
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
      }
    );

    ExplanationWebviewPanel.currentPanel = new ExplanationWebviewPanel(panel, report);
  }

  public update(report: FunctionComplexityReport): void {
    this._panel.title = `${report.functionName} · complexidade`;
    this._panel.webview.html = this.getHtmlForWebview(report);
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  private getStepIcon(type: string): string {
    switch (type) {
      case 'loop':
        return '<ion-icon name="repeat-outline" class="step-icon step-icon-loop"></ion-icon>';
      case 'recursion':
        return '<ion-icon name="git-branch-outline" class="step-icon step-icon-recursion"></ion-icon>';
      case 'space':
        return '<ion-icon name="hardware-chip-outline" class="step-icon step-icon-space"></ion-icon>';
      case 'summary':
        return '<ion-icon name="analytics-outline" class="step-icon step-icon-summary"></ion-icon>';
      default:
        return '<ion-icon name="code-working-outline" class="step-icon"></ion-icon>';
    }
  }

  private getHtmlForWebview(report: FunctionComplexityReport): string {
    const nonce = this.getNonce();
    const cspSource = this._panel.webview.cspSource;
    const stepsHtml = report.reasoningSteps
      .map(
        (step) => `
      <li class="step">
        <div class="step-icon-badge">
          ${this.getStepIcon(step.type)}
        </div>
        <div class="step-body">
          <div class="step-head">
            <span class="step-title">${this.escapeHtml(step.title)}</span>
            <code class="step-cost">${this.escapeHtml(step.complexity)}</code>
          </div>
          <p class="step-detail">${this.escapeHtml(step.detail)}</p>
        </div>
      </li>`
      )
      .join('');

    const annotationsHtml = report.annotations
      .map(
        (ann) => `
        <tr>
          <td class="mono dim">L${ann.line}</td>
          <td class="mono"><code>${this.escapeHtml(ann.cost)}</code></td>
          <td>${this.escapeHtml(ann.explanation)}</td>
        </tr>`
      )
      .join('');

    const scaleHtml = COMPLEXITY_SCALE.map((c) => {
      const active = c === report.timeComplexity;
      return `<span class="scale-item${active ? ' active' : ''}">${c}</span>`;
    }).join('<span class="scale-sep">→</span>');

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' ${cspSource} https://unpkg.com; script-src 'nonce-${nonce}' https://unpkg.com 'unsafe-inline'; connect-src https://unpkg.com; font-src https://unpkg.com;">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complexidade assintótica</title>
  <script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"></script>
  <script nomodule src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"></script>
  <style>
    :root {
      --accent: var(--vscode-textLink-foreground, var(--vscode-charts-blue, #4daafc));
      --border: var(--vscode-widget-border, var(--vscode-panel-border, rgba(128,128,128,0.3)));
    }
    * { box-sizing: border-box; }
    body {
      font-family: var(--vscode-font-family, -apple-system, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      margin: 0;
      padding: 28px 32px 48px;
      line-height: 1.55;
    }
    ion-icon {
      vertical-align: middle;
      flex-shrink: 0;
    }
    .mono {
      font-family: var(--vscode-editor-font-family, 'SF Mono', Menlo, Consolas, monospace);
    }
    code {
      font-family: var(--vscode-editor-font-family, 'SF Mono', Menlo, Consolas, monospace);
      background: var(--vscode-textCodeBlock-background, rgba(128,128,128,0.12));
      padding: 1px 5px;
      border-radius: 3px;
      font-size: 0.9em;
    }

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 24px;
    }
    h1 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.05rem;
      font-weight: 600;
      margin: 0;
    }
    .header-icon {
      font-size: 1.3rem;
      color: var(--accent);
    }
    h1 .fn {
      font-family: var(--vscode-editor-font-family, monospace);
      color: var(--accent);
    }
    .complexities {
      display: flex;
      gap: 18px;
      font-size: 0.85rem;
    }
    .metric {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .metric-icon {
      font-size: 1rem;
      color: var(--accent);
      opacity: 0.85;
    }
    .complexities .label {
      opacity: 0.6;
      margin-right: 4px;
    }
    .complexities .value {
      font-family: var(--vscode-editor-font-family, monospace);
      font-weight: 600;
    }

    .disclaimer {
      margin: 0 0 24px;
      padding: 12px 14px;
      border: 1px solid var(--border);
      border-left: 4px solid var(--accent);
      border-radius: 8px;
      background: var(--vscode-textCodeBlock-background, rgba(128,128,128,0.08));
      color: var(--vscode-descriptionForeground, var(--vscode-foreground));
      font-size: 0.9rem;
      line-height: 1.6;
    }
    .disclaimer strong {
      color: var(--vscode-foreground);
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      opacity: 0.65;
      margin: 0 0 14px;
    }
    .section-icon {
      font-size: 1rem;
      color: var(--accent);
    }
    section {
      margin-bottom: 30px;
    }

    ol.steps {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .step {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 6px;
      transition: background 0.15s ease;
      margin-bottom: 4px;
    }
    .step:hover {
      background: var(--vscode-list-hoverBackground, rgba(128,128,128,0.06));
    }
    .step-icon-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: var(--vscode-textCodeBlock-background, rgba(128,128,128,0.1));
      font-size: 1.15rem;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .step-icon-loop { color: var(--vscode-charts-blue, #4daafc); }
    .step-icon-recursion { color: var(--vscode-charts-purple, #c586c0); }
    .step-icon-space { color: var(--vscode-charts-green, #4ec9b0); }
    .step-icon-summary { color: var(--vscode-charts-orange, #ce9178); }

    .step-body {
      flex: 1;
    }
    .step-head {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 3px;
    }
    .step-title {
      font-weight: 600;
    }
    .step-cost {
      opacity: 0.9;
    }
    .step-detail {
      margin: 0;
      opacity: 0.75;
      font-size: 0.92em;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9em;
    }
    th {
      text-align: left;
      font-weight: 600;
      opacity: 0.55;
      font-size: 0.78em;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 0 12px 8px 0;
      border-bottom: 1px solid var(--border);
    }
    td {
      padding: 7px 12px 7px 0;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
    }
    td.dim { opacity: 0.55; }
    tr:last-child td { border-bottom: none; }

    .scale {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 2px;
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 0.85rem;
    }
    .scale-item {
      padding: 3px 8px;
      border-radius: 3px;
      opacity: 0.45;
    }
    .scale-item.active {
      opacity: 1;
      background: var(--vscode-textCodeBlock-background, rgba(128,128,128,0.12));
      color: var(--accent);
      font-weight: 600;
      outline: 1px solid var(--accent);
    }
    .scale-sep {
      opacity: 0.25;
      font-size: 0.8rem;
    }
  </style>
</head>
<body>
  <header>
    <h1>
      <ion-icon name="code-slash-outline" class="header-icon"></ion-icon>
      Função <span class="fn">${this.escapeHtml(report.functionName)}</span>
    </h1>
    <div class="complexities">
      <span class="metric">
        <ion-icon name="time-outline" class="metric-icon"></ion-icon>
        <span class="label">tempo</span>
        <span class="value">${this.escapeHtml(report.timeComplexity)}</span>
      </span>
      <span class="metric">
        <ion-icon name="hardware-chip-outline" class="metric-icon"></ion-icon>
        <span class="label">espaço</span>
        <span class="value">${this.escapeHtml(report.spaceComplexity)}</span>
      </span>
    </div>
  </header>

  <section>
    <h2><ion-icon name="git-network-outline" class="section-icon"></ion-icon> Raciocínio</h2>
    <ol class="steps">
      ${stepsHtml}
    </ol>
  </section>

  ${report.annotations.length > 0
        ? `
  <section>
    <h2><ion-icon name="list-outline" class="section-icon"></ion-icon> Anotações de linha</h2>
    <table>
      <thead>
        <tr><th>Local</th><th>Custo</th><th>Explicação</th></tr>
      </thead>
      <tbody>
        ${annotationsHtml}
      </tbody>
    </table>
  </section>`
        : ''
      }

  <section>
    <h2><ion-icon name="bar-chart-outline" class="section-icon"></ion-icon> Escala de referência</h2>
    <div class="scale">${scaleHtml}</div>
  </section>

  <p class="disclaimer">
  <strong>Disclaimer:</strong> esta visualização apresenta uma análise estática baseada em AST (Abstract Syntax Tree) e heurísticas sintáticas de estrutura do código. As inferências exibidas representam diagnósticos aproximados derivados de padrões estruturais identificáveis no código e não constituem uma prova formal de complexidade, desempenho ou comportamento em todos os cenários de execução.
  <br><br>
  Códigos que utilizam compilação dinâmica, metaprogramação, reflexão, comportamento fortemente dependente de dados em runtime ou formas complexas de recursão indireta podem produzir inferências imprecisas ou incompletas.
  <br><br>
  Para aprofundamento sobre análise de algoritmos e fundamentos teóricos, consulte <em>Introduction to Algorithms</em>, de Cormen, Leiserson, Rivest e Stein.
</p>
</body>
</html>`;
  }

  public dispose(): void {
    ExplanationWebviewPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}