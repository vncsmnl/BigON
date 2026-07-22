import * as vscode from 'vscode';
import { FunctionComplexityReport } from '../analyzer/types';

export class AsymptoticHoverProvider implements vscode.HoverProvider {
  constructor(private getReports: (doc: vscode.TextDocument) => FunctionComplexityReport[]) { }

  public provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    const enabled = vscode.workspace
      .getConfiguration('BigON')
      .get<boolean>('enableHover', true);

    if (!enabled) return null;

    const reports = this.getReports(document);
    if (!reports || reports.length === 0) return null;

    const currentLine = position.line + 1;
    const fnReport = reports.find(
      (r) => currentLine >= r.startLine && currentLine <= r.startLine + 2
    );

    if (!fnReport) return null;

    const md = new vscode.MarkdownString();
    md.isTrusted = true;
    md.appendMarkdown(`### Complexidade de **${fnReport.functionName}**\n\n`);
    md.appendMarkdown(`- **Tempo**: \`${fnReport.timeComplexity}\`\n`);
    md.appendMarkdown(`- **Espaço**: \`${fnReport.spaceComplexity}\`\n\n`);

    md.appendMarkdown(`--- \n**Motivos / Justificativa:**\n`);
    for (const step of fnReport.reasoningSteps) {
      md.appendMarkdown(`- ${step.title}: *${step.detail}*\n`);
    }

    return new vscode.Hover(md);
  }
}
