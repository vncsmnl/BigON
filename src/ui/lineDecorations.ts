import * as vscode from 'vscode';
import { FunctionComplexityReport } from '../analyzer/types';

export class LineDecorationManager {
  private decorationType: vscode.TextEditorDecorationType;
  private enabled: boolean = true;

  constructor() {
    this.decorationType = vscode.window.createTextEditorDecorationType({
      after: {
        margin: '0 0 0 2em',
        fontStyle: 'normal',
        fontWeight: '600',
      },
      isWholeLine: false,
    });
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;

    if (!this.enabled) {
      const activeEditor = vscode.window.activeTextEditor;

      if (activeEditor) {
        activeEditor.setDecorations(this.decorationType, []);
      }
    }

    return this.enabled;
  }

  public updateDecorations(
    editor: vscode.TextEditor,
    functionReports: FunctionComplexityReport[]
  ): void {
    if (!this.enabled) {
      editor.setDecorations(this.decorationType, []);
      return;
    }

    const isEnabledSetting = vscode.workspace
      .getConfiguration('BigON')
      .get<boolean>('enableInlineDecorations', true);

    if (!isEnabledSetting) {
      editor.setDecorations(this.decorationType, []);
      return;
    }

    const decorations: vscode.DecorationOptions[] = [];

    for (const fnReport of functionReports) {
      for (const ann of fnReport.annotations) {
        const lineIndex = ann.line - 1;

        if (lineIndex >= 0 && lineIndex < editor.document.lineCount) {
          const lineRange = editor.document.lineAt(lineIndex).range;

          const badgeColor = this.getBadgeColor(ann.cost);
          const badgeBackground = this.getBadgeBackground(badgeColor);

          decorations.push({
            range: lineRange,

            hoverMessage: new vscode.MarkdownString(
              `**Complexidade assintótica**: ${ann.explanation}\n\n` +
              `**Custo**: \`${ann.cost}\``
            ),

            renderOptions: {
              after: {
                contentText: ` ${ann.label} `,
                color: badgeColor,
                backgroundColor: badgeBackground,
                fontStyle: 'normal',
                fontWeight: '600',
              },
            },
          });
        }
      }
    }

    editor.setDecorations(this.decorationType, decorations);
  }

  private getBadgeColor(cost: string): string {
    switch (cost) {
      case 'O(1)':
      case 'O(log n)':
        return '#4EC9B0';

      case 'O(n)':
        return '#DCDCAA';

      case 'O(n log n)':
        return '#CE9178';

      case 'O(n^2)':
      case 'O(n^3)':
        return '#F44747';

      case 'O(2^n)':
      case 'O(n!)':
        return '#C586C0';

      default:
        return '#808080';
    }
  }

  private getBadgeBackground(color: string): string {
    switch (color) {
      case '#4EC9B0':
        return 'rgba(78, 201, 176, 0.12)';

      case '#DCDCAA':
        return 'rgba(220, 220, 170, 0.12)';

      case '#CE9178':
        return 'rgba(206, 145, 120, 0.12)';

      case '#F44747':
        return 'rgba(244, 71, 71, 0.14)';

      case '#C586C0':
        return 'rgba(197, 134, 192, 0.14)';

      default:
        return 'rgba(128, 128, 128, 0.12)';
    }
  }

  public dispose(): void {
    this.decorationType.dispose();
  }
}