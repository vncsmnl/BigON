import * as vscode from 'vscode';
import { ComplexityEngine } from '../analyzer/complexityEngine';
import { normalizeLanguageId } from '../analyzer/universal/universalParserRouter';
import { FunctionComplexityReport } from '../analyzer/types';

export class AsymptoticCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

  private engine: ComplexityEngine = new ComplexityEngine();
  private reportsCache: Map<string, FunctionComplexityReport[]>;

  constructor(sharedCache?: Map<string, FunctionComplexityReport[]>) {
    this.reportsCache = sharedCache || new Map();
  }

  public refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }

  public provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    const enabled = vscode.workspace
      .getConfiguration('BigON')
      .get<boolean>('enableCodeLens', true);

    if (!enabled) return [];

    const normLang = normalizeLanguageId(document.languageId, document.fileName);
    const code = document.getText();
    const result = this.engine.analyzeCode(code, document.fileName, normLang);
    this.reportsCache.set(document.uri.toString(), result.functions);

    const codeLenses: vscode.CodeLens[] = [];

    for (const fnReport of result.functions) {
      const position = new vscode.Position(fnReport.startLine - 1, 0);
      const range = new vscode.Range(position, position);

      const title = `$(pulse) BigON: Tempo ${fnReport.timeComplexity} | Espaço ${fnReport.spaceComplexity} [Ver Explicação]`;

      const codeLens = new vscode.CodeLens(range, {
        title,
        command: 'BigON.openExplanation',
        arguments: [fnReport, document.uri.toString()],
      });

      codeLenses.push(codeLens);
    }

    return codeLenses;
  }

  public getCachedReports(uri: string): FunctionComplexityReport[] {
    return this.reportsCache.get(uri) || [];
  }
}
