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

interface GrowthCurve {
  id: string;
  label: string;
  cormenClass: string;
  efficiency: 'Excelente' | 'Boa' | 'Aceitável' | 'Ruim' | 'Péssima';
  color: string;
  pathD: string;
  desc: string;
}

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

  private normalizeComplexity(complexity: string): string {
    return complexity
      .replace('O(n^2)', 'O(n²)')
      .replace('O(n^3)', 'O(n³)')
      .replace('O(n^4)', 'O(n⁴)')
      .trim();
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

  private getEfficiencyBadge(complexity: string): { text: string; colorClass: string } {
    const norm = this.normalizeComplexity(complexity);
    if (norm === 'O(1)' || norm === 'O(log n)' || norm === 'O(sqrt n)') {
      return { text: 'Excelente', colorClass: 'badge-excelente' };
    } else if (norm === 'O(n)') {
      return { text: 'Boa', colorClass: 'badge-boa' };
    } else if (norm === 'O(n log n)') {
      return { text: 'Aceitável', colorClass: 'badge-aceitavel' };
    } else if (norm === 'O(n²)' || norm === 'O(n³)' || norm === 'O(n⁴)') {
      return { text: 'Ruim', colorClass: 'badge-ruim' };
    } else if (norm === 'O(2^n)' || norm === 'O(n!)') {
      return { text: 'Péssima', colorClass: 'badge-pessima' };
    }
    return { text: 'Variável', colorClass: 'badge-info' };
  }

  private generateSvgChart(timeComp: string, spaceComp: string): string {
    const normTime = this.normalizeComplexity(timeComp);
    const normSpace = this.normalizeComplexity(spaceComp);

    // Coordinate space 540x260
    // Origin (left-bottom margin): (60, 220), Top-right: (510, 30)
    const curves: GrowthCurve[] = [
      {
        id: 'O(1)',
        label: 'O(1)',
        cormenClass: 'Constante',
        efficiency: 'Excelente',
        color: '#4ec9b0',
        pathD: 'M 60 210 L 510 210',
        desc: 'Tempo constante. O tempo de execução não depende do tamanho do problema n.'
      },
      {
        id: 'O(log n)',
        label: 'O(log n)',
        cormenClass: 'Logarítmica',
        efficiency: 'Excelente',
        color: '#4daafc',
        pathD: 'M 60 210 Q 150 180, 510 160',
        desc: 'Crescimento logarítmico. Exemplo: Busca Binária (Cormen Cap. 2.3).'
      },
      {
        id: 'O(n)',
        label: 'O(n)',
        cormenClass: 'Linear',
        efficiency: 'Boa',
        color: '#b5cea8',
        pathD: 'M 60 210 L 510 110',
        desc: 'Tempo linear. O tempo cresce proporcionalmente ao tamanho da entrada n.'
      },
      {
        id: 'O(n log n)',
        label: 'O(n log n)',
        cormenClass: 'Linearítmica / Quasilinear',
        efficiency: 'Aceitável',
        color: '#dcdcaa',
        pathD: 'M 60 210 Q 280 140, 510 65',
        desc: 'Crescimento quasilinear. Exemplo: Merge Sort e Heap Sort (Cormen Cap. 2.3 & 6).'
      },
      {
        id: 'O(n²)',
        label: 'O(n²)',
        cormenClass: 'Quadrática',
        efficiency: 'Ruim',
        color: '#ce9178',
        pathD: 'M 60 210 Q 320 180, 480 30',
        desc: 'Tempo quadrático. Típico de laços aninhados simples. Exemplo: Insertion Sort (Cormen Cap. 2.1).'
      },
      {
        id: 'O(2^n)',
        label: 'O(2^n)',
        cormenClass: 'Exponencial',
        efficiency: 'Péssima',
        color: '#f44747',
        pathD: 'M 60 210 Q 260 200, 310 30',
        desc: 'Crescimento exponencial. Intratável para valores médios/grandes de n.'
      },
      {
        id: 'O(n!)',
        label: 'O(n!)',
        cormenClass: 'Fatorial',
        efficiency: 'Péssima',
        color: '#d16969',
        pathD: 'M 60 210 Q 180 205, 210 30',
        desc: 'Crescimento fatorial. Algoritmos de força bruta para permutações (ex.: Caixeiro Viajante).'
      }
    ];

    const curvesSvg = curves
      .map((c) => {
        const isTimeActive = normTime === c.id;
        const isSpaceActive = normSpace === c.id;
        const isActive = isTimeActive || isSpaceActive;

        const strokeWidth = isActive ? '3.5' : '1.8';
        const opacity = isActive ? '1' : '0.35';
        const strokeDash = isSpaceActive && !isTimeActive ? '6,4' : 'none';
        const activeMarker = isActive ? `filter="url(#glow)"` : '';

        return `
        <path d="${c.pathD}" 
              fill="none" 
              stroke="${c.color}" 
              stroke-width="${strokeWidth}" 
              stroke-opacity="${opacity}"
              stroke-dasharray="${strokeDash}"
              ${activeMarker} 
              class="chart-curve ${isActive ? 'active-curve' : ''}" />
      `;
      })
      .join('');

    const legendItems = curves
      .map((c) => {
        const isTimeActive = normTime === c.id;
        const isSpaceActive = normSpace === c.id;
        const activeClass = isTimeActive || isSpaceActive ? 'active-legend' : '';

        let badgeTag = '';
        if (isTimeActive && isSpaceActive) {
          badgeTag = `<span class="tag tag-both">Tempo & Espaço</span>`;
        } else if (isTimeActive) {
          badgeTag = `<span class="tag tag-time">Tempo</span>`;
        } else if (isSpaceActive) {
          badgeTag = `<span class="tag tag-space">Espaço</span>`;
        }

        return `
        <div class="legend-item ${activeClass}">
          <span class="legend-color" style="background-color: ${c.color}"></span>
          <span class="legend-label mono">${c.label}</span>
          <span class="legend-class">${c.cormenClass}</span>
          ${badgeTag}
        </div>
      `;
      })
      .join('');

    return `
    <div class="chart-container">
      <div class="svg-wrapper">
        <svg viewBox="0 0 540 260" class="growth-chart" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="grid-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="var(--vscode-editor-foreground)" stop-opacity="0.03"/>
              <stop offset="100%" stop-color="var(--vscode-editor-foreground)" stop-opacity="0.08"/>
            </linearGradient>
          </defs>

          <!-- Fundo & Linhas de Grade -->
          <rect x="60" y="30" width="450" height="180" fill="url(#grid-grad)" rx="4"/>
          <line x1="60" y1="75" x2="510" y2="75" stroke="var(--border)" stroke-opacity="0.25" stroke-dasharray="3,3" />
          <line x1="60" y1="120" x2="510" y2="120" stroke="var(--border)" stroke-opacity="0.25" stroke-dasharray="3,3" />
          <line x1="60" y1="165" x2="510" y2="165" stroke="var(--border)" stroke-opacity="0.25" stroke-dasharray="3,3" />

          <line x1="172.5" y1="30" x2="172.5" y2="210" stroke="var(--border)" stroke-opacity="0.25" stroke-dasharray="3,3" />
          <line x1="285" y1="30" x2="285" y2="210" stroke="var(--border)" stroke-opacity="0.25" stroke-dasharray="3,3" />
          <line x1="397.5" y1="30" x2="397.5" y2="210" stroke="var(--border)" stroke-opacity="0.25" stroke-dasharray="3,3" />

          <!-- Eixos X e Y -->
          <line x1="60" y1="210" x2="515" y2="210" stroke="var(--vscode-foreground)" stroke-opacity="0.6" stroke-width="1.5" />
          <line x1="60" y1="210" x2="60" y2="25" stroke="var(--vscode-foreground)" stroke-opacity="0.6" stroke-width="1.5" />

          <!-- Setas dos Eixos -->
          <polygon points="515,207 522,210 515,213" fill="var(--vscode-foreground)" fill-opacity="0.7"/>
          <polygon points="57,25 60,18 63,25" fill="var(--vscode-foreground)" fill-opacity="0.7"/>

          <!-- Rótulos dos Eixos -->
          <text x="285" y="238" text-anchor="middle" class="axis-label">Tamanho da Entrada (n) →</text>
          <text x="22" y="120" text-anchor="middle" transform="rotate(-90 22 120)" class="axis-label">Operações / Memória →</text>

          <!-- Curvas de Crescimento -->
          ${curvesSvg}
        </svg>
      </div>

      <div class="legend-grid">
        ${legendItems}
      </div>
    </div>`;
  }

  private getHtmlForWebview(report: FunctionComplexityReport): string {
    const nonce = this.getNonce();
    const cspSource = this._panel.webview.cspSource;

    const timeBadge = this.getEfficiencyBadge(report.timeComplexity);
    const spaceBadge = this.getEfficiencyBadge(report.spaceComplexity);

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

    const normalizedTime = this.normalizeComplexity(report.timeComplexity);
    const scaleHtml = COMPLEXITY_SCALE.map((c) => {
      const active = c === normalizedTime;
      return `<span class="scale-item${active ? ' active' : ''}">${c}</span>`;
    }).join('<span class="scale-sep">→</span>');

    const svgChartHtml = this.generateSvgChart(report.timeComplexity, report.spaceComplexity);

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' ${cspSource} https://unpkg.com; script-src 'nonce-${nonce}' https://unpkg.com 'unsafe-inline'; connect-src https://unpkg.com; font-src https://unpkg.com;">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Análise de Complexidade Assintótica</title>
  <script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"></script>
  <script nomodule src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"></script>
  <style>
    :root {
      --accent: var(--vscode-textLink-foreground, var(--vscode-charts-blue, #4daafc));
      --accent-green: var(--vscode-charts-green, #4ec9b0);
      --accent-orange: var(--vscode-charts-orange, #ce9178);
      --accent-purple: var(--vscode-charts-purple, #c586c0);
      --border: var(--vscode-widget-border, var(--vscode-panel-border, rgba(128,128,128,0.25)));
      --card-bg: var(--vscode-textCodeBlock-background, rgba(128,128,128,0.06));
    }
    * { box-sizing: border-box; }
    body {
      font-family: var(--vscode-font-family, -apple-system, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
      margin: 0;
      padding: 24px 28px 48px;
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
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.9em;
    }

    /* HEADER */
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px 20px;
      padding-bottom: 18px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 20px;
    }
    h1 {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.15rem;
      font-weight: 600;
      margin: 0;
    }
    .header-icon {
      font-size: 1.4rem;
      color: var(--accent);
    }
    h1 .fn {
      font-family: var(--vscode-editor-font-family, monospace);
      color: var(--accent);
      background: var(--card-bg);
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid var(--border);
    }
    .complexities {
      display: flex;
      gap: 14px;
    }
    .metric-card {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 6px;
    }
    .metric-icon {
      font-size: 1.1rem;
      color: var(--accent);
    }
    .metric-info {
      display: flex;
      flex-direction: column;
    }
    .metric-info .label {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      opacity: 0.65;
    }
    .metric-info .value {
      font-family: var(--vscode-editor-font-family, monospace);
      font-weight: 700;
      font-size: 0.95rem;
    }

    /* BADGES */
    .badge {
      font-size: 0.72rem;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .badge-excelente { background: rgba(78, 201, 176, 0.2); color: #4ec9b0; border: 1px solid rgba(78, 201, 176, 0.4); }
    .badge-boa { background: rgba(77, 170, 252, 0.2); color: #4daafc; border: 1px solid rgba(77, 170, 252, 0.4); }
    .badge-aceitavel { background: rgba(220, 204, 170, 0.2); color: #dcdcaa; border: 1px solid rgba(220, 204, 170, 0.4); }
    .badge-ruim { background: rgba(206, 145, 120, 0.2); color: #ce9178; border: 1px solid rgba(206, 145, 120, 0.4); }
    .badge-pessima { background: rgba(244, 71, 71, 0.2); color: #f44747; border: 1px solid rgba(244, 71, 71, 0.4); }
    .badge-info { background: rgba(128, 128, 128, 0.2); color: var(--vscode-foreground); border: 1px solid var(--border); }

    /* TABS */
    .tab-bar {
      display: flex;
      gap: 4px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 24px;
    }
    .tab-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: transparent;
      border: none;
      color: var(--vscode-foreground);
      opacity: 0.65;
      padding: 8px 14px;
      font-size: 0.88rem;
      font-weight: 500;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.15s ease;
    }
    .tab-btn:hover {
      opacity: 0.95;
      background: var(--card-bg);
    }
    .tab-btn.active {
      opacity: 1;
      font-weight: 600;
      color: var(--accent);
      border-bottom-color: var(--accent);
    }
    .tab-content {
      display: none;
    }
    .tab-content.active {
      display: block;
    }

    /* SECTIONS & HEADINGS */
    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.82rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      opacity: 0.8;
      margin: 0 0 14px;
      color: var(--vscode-foreground);
    }
    .section-icon {
      font-size: 1.1rem;
      color: var(--accent);
    }
    section {
      margin-bottom: 28px;
    }

    /* RACIOCÍNIO STEPS */
    ol.steps {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .step {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 8px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      margin-bottom: 8px;
      transition: border-color 0.15s ease;
    }
    .step:hover {
      border-color: var(--accent);
    }
    .step-icon-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border-radius: 6px;
      background: var(--vscode-editor-background);
      border: 1px solid var(--border);
      font-size: 1.2rem;
      flex-shrink: 0;
    }
    .step-icon-loop { color: #4daafc; }
    .step-icon-recursion { color: #c586c0; }
    .step-icon-space { color: #4ec9b0; }
    .step-icon-summary { color: #ce9178; }

    .step-body { flex: 1; }
    .step-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 4px;
    }
    .step-title { font-weight: 600; }
    .step-detail {
      margin: 0;
      opacity: 0.8;
      font-size: 0.9em;
    }

    /* TABLE */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9em;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      overflow: hidden;
    }
    th {
      text-align: left;
      font-weight: 600;
      opacity: 0.65;
      font-size: 0.76em;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
      background: rgba(128,128,128,0.04);
    }
    td {
      padding: 9px 14px;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
    }
    td.dim { opacity: 0.6; }
    tr:last-child td { border-bottom: none; }

    /* SVG CHART & LEGEND */
    .chart-container {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .svg-wrapper {
      width: 100%;
      max-width: 680px;
      margin: 0 auto;
    }
    .growth-chart {
      width: 100%;
      height: auto;
      display: block;
    }
    .axis-label {
      font-size: 11px;
      fill: var(--vscode-foreground);
      opacity: 0.7;
      font-family: var(--vscode-font-family, sans-serif);
    }
    .chart-curve {
      transition: stroke-width 0.2s, stroke-opacity 0.2s;
    }
    .legend-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      gap: 8px;
      margin-top: 16px;
      padding-top: 14px;
      border-top: 1px solid var(--border);
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border-radius: 6px;
      background: var(--vscode-editor-background);
      border: 1px solid var(--border);
      font-size: 0.82rem;
      opacity: 0.7;
    }
    .legend-item.active-legend {
      opacity: 1;
      border-color: var(--accent);
      box-shadow: 0 0 6px rgba(77, 170, 252, 0.25);
    }
    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 3px;
      flex-shrink: 0;
    }
    .legend-label {
      font-weight: 700;
    }
    .legend-class {
      opacity: 0.75;
      font-size: 0.78rem;
    }
    .tag {
      font-size: 0.68rem;
      padding: 1px 5px;
      border-radius: 3px;
      font-weight: 600;
      margin-left: auto;
    }
    .tag-time { background: rgba(77, 170, 252, 0.25); color: #4daafc; }
    .tag-space { background: rgba(78, 201, 176, 0.25); color: #4ec9b0; }
    .tag-both { background: rgba(197, 134, 192, 0.25); color: #c586c0; }

    /* SCALE */
    .scale {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px;
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 0.85rem;
      background: var(--card-bg);
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid var(--border);
    }
    .scale-item {
      padding: 4px 10px;
      border-radius: 4px;
      opacity: 0.45;
      transition: all 0.2s ease;
    }
    .scale-item.active {
      opacity: 1;
      background: var(--vscode-editor-background);
      color: var(--accent);
      font-weight: 700;
      border: 1px solid var(--accent);
      box-shadow: 0 0 8px rgba(77, 170, 252, 0.2);
    }
    .scale-sep {
      opacity: 0.25;
      font-size: 0.8rem;
    }

    /* THEORY CARDS (CORMEN) */
    .theory-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 18px 20px;
      margin-bottom: 18px;
    }
    .theory-card h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.98rem;
      margin: 0 0 10px;
      color: var(--accent);
    }
    .formula-box {
      background: var(--vscode-editor-background);
      border: 1px solid var(--border);
      border-left: 4px solid var(--accent);
      padding: 12px 16px;
      border-radius: 6px;
      font-family: var(--vscode-editor-font-family, monospace);
      margin: 12px 0;
      font-size: 0.9rem;
      line-height: 1.6;
    }
    .citation {
      margin-top: 14px;
      padding-top: 10px;
      border-top: 1px opacity 0.2 var(--border);
      font-size: 0.82rem;
      opacity: 0.7;
      font-style: italic;
    }

    .disclaimer {
      margin: 28px 0 0;
      padding: 14px 16px;
      border: 1px solid var(--border);
      border-left: 4px solid var(--accent);
      border-radius: 8px;
      background: var(--card-bg);
      color: var(--vscode-descriptionForeground, var(--vscode-foreground));
      font-size: 0.88rem;
      line-height: 1.6;
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
      <div class="metric-card">
        <ion-icon name="time-outline" class="metric-icon"></ion-icon>
        <div class="metric-info">
          <span class="label">Tempo</span>
          <span class="value">${this.escapeHtml(report.timeComplexity)}</span>
        </div>
        <span class="badge ${timeBadge.colorClass}">${timeBadge.text}</span>
      </div>
      <div class="metric-card">
        <ion-icon name="hardware-chip-outline" class="metric-icon"></ion-icon>
        <div class="metric-info">
          <span class="label">Espaço</span>
          <span class="value">${this.escapeHtml(report.spaceComplexity)}</span>
        </div>
        <span class="badge ${spaceBadge.colorClass}">${spaceBadge.text}</span>
      </div>
    </div>
  </header>

  <!-- BARRA DE ABAS NA WEBVIEW -->
  <nav class="tab-bar">
    <button class="tab-btn active" data-tab="tab-analysis">
      <ion-icon name="analytics-outline"></ion-icon> Análise da Função
    </button>
    <button class="tab-btn" data-tab="tab-chart">
      <ion-icon name="bar-chart-outline"></ion-icon> Gráfico Assintótico
    </button>
    <button class="tab-btn" data-tab="tab-theory">
      <ion-icon name="book-outline"></ion-icon> Teoria & Notação (Cormen)
    </button>
  </nav>

  <!-- ABA 1: ANÁLISE DA FUNÇÃO -->
  <div id="tab-analysis" class="tab-content active">
    <section>
      <h2><ion-icon name="git-network-outline" class="section-icon"></ion-icon> Passos de Raciocínio (AST)</h2>
      <ol class="steps">
        ${stepsHtml}
      </ol>
    </section>

    ${report.annotations.length > 0
        ? `
    <section>
      <h2><ion-icon name="list-outline" class="section-icon"></ion-icon> Anotações de Linha</h2>
      <table>
        <thead>
          <tr><th>Local</th><th>Custo</th><th>Explicação Sintática</th></tr>
        </thead>
        <tbody>
          ${annotationsHtml}
        </tbody>
      </table>
    </section>`
        : ''
      }
  </div>

  <!-- ABA 2: GRÁFICO ASSINTÓTICO DE CRESCIMENTO -->
  <div id="tab-chart" class="tab-content">
    <section>
      <h2><ion-icon name="trending-up-outline" class="section-icon"></ion-icon> Curvas de Crescimento Assintótico (Gráfico Didático)</h2>
      <p style="opacity: 0.8; font-size: 0.9em; margin-bottom: 14px;">
        O gráfico abaixo ilustra como o consumo de tempo ou memória escala à medida que o tamanho da entrada $n$ cresce para o infinito. 
        A curva destacada representa a complexidade identificada para a função <strong>${this.escapeHtml(report.functionName)}</strong>.
      </p>
      
      ${svgChartHtml}
    </section>

    <section>
      <h2><ion-icon name="bar-chart-outline" class="section-icon"></ion-icon> Escala Linear de Ordenação</h2>
      <div class="scale">${scaleHtml}</div>
    </section>
  </div>

  <!-- ABA 3: FUNDAMENTAÇÃO TEÓRICA (CORMEN ET AL. - CLRS) -->
  <div id="tab-theory" class="tab-content">
    <div class="theory-card">
      <h3><ion-icon name="school-outline" class="section-icon"></ion-icon> O que é a Notação Big-O ($O$)?</h3>
      <p>
        Segundo a obra clássica <em>Introduction to Algorithms</em> (Cormen, Leiserson, Rivest e Stein - Capítulo 3), a <strong>Notação Big-O</strong> ($O$-notation) é utilizada para definir um <strong>limite superior assintótico</strong> (asymptotic upper bound) para a taxa de crescimento de um algoritmo.
      </p>
      <div class="formula-box">
        <strong>Definição Matemática Formal (Cormen et al.):</strong><br>
        Para uma dada função $g(n)$, definimos $O(g(n))$ como o conjunto de funções:<br><br>
        <code>O(g(n)) = { f(n) : existem constantes positivas c e n₀ tais que 0 ≤ f(n) ≤ c · g(n) para todo n ≥ n₀ }</code>
      </div>
      <p>
        Em termos didáticos: a notação $O(g(n))$ garante que, para entradas suficientemente grandes ($n \ge n_0$), o tempo ou memória consumidos pelo algoritmo nunca ultrapassarão um múltiplo constante de $g(n)$. É a medida padrão para o <strong>pior caso</strong> (worst-case scenario).
      </p>
      <div class="citation">
        Ref: CORMEN, T. H.; LEISERSON, C. E.; RIVEST, R. L.; STEIN, C. <em>Algoritmos: Teoria e Prática</em>. 3ª ed. Elsevier / Campus, Cap. 3 (Crescimento de Funções).
      </div>
    </div>

    <div class="theory-card">
      <h3><ion-icon name="swap-horizontal-outline" class="section-icon"></ion-icon> Complexidade de Tempo vs. Complexidade de Espaço</h3>
      <p>
        Ao analisar algoritmos no modelo RAM (Random-Access Machine) proposto por Cormen et al., avaliamos dois recursos fundamentais:
      </p>
      <ul>
        <li>
          <strong>Complexidade de Tempo ($T(n)$):</strong> Mede o número de operações fundamentais (comparações, atribuições, laços) executadas em função do tamanho da entrada $n$. Determina a velocidade de execução do algoritmo.
        </li>
        <li style="margin-top: 8px;">
          <strong>Complexidade de Espaço ($S(n)$):</strong> Mede a quantidade de memória adicional (chamada de <em>espaço auxiliar</em>) exigida pela função durante a execução além dos dados de entrada. Inclui variáveis locais, pilhas de chamadas recursivas e arranjos temporários.
        </li>
      </ul>
      <p style="font-size: 0.9em; opacity: 0.85; margin-top: 10px;">
        <em>Nota de Trade-off (Cormen Cap. 1 & 2):</em> Frequentemente, algoritmos realizam uma troca (trade-off) entre tempo e espaço — utilizando mais memória para pré-calcular resultados e assim reduzir o tempo de execução (ex.: Tabelas Hash ou Programação Dinâmica).
      </p>
    </div>
  </div>

  <p class="disclaimer">
    <strong>Disclaimer Técnico:</strong> Esta análise é realizada via parse de AST (Abstract Syntax Tree) e heurísticas sintáticas. A notação assintótica reflete estimativas teóricas aproximadas conforme os padrões descritos em Cormen et al.
  </p>

  <script nonce="${nonce}">
    (function() {
      const btns = document.querySelectorAll('.tab-btn');
      const tabs = document.querySelectorAll('.tab-content');

      btns.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          const targetId = this.getAttribute('data-tab');

          btns.forEach(function(b) { b.classList.remove('active'); });
          tabs.forEach(function(t) { t.classList.remove('active'); });

          this.classList.add('active');
          const targetTab = document.getElementById(targetId);
          if (targetTab) {
            targetTab.classList.add('active');
          }
        });
      });
    })();
  </script>
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