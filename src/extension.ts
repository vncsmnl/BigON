import * as vscode from 'vscode';
import { AsymptoticCodeLensProvider } from './ui/codeLensProvider';
import { AsymptoticHoverProvider } from './ui/hoverProvider';
import { LineDecorationManager } from './ui/lineDecorations';
import { ExplanationWebviewPanel } from './ui/webviewPanel';
import { ComplexityEngine } from './analyzer/complexityEngine';
import { normalizeLanguageId } from './analyzer/universal/universalParserRouter';
import { FunctionComplexityReport } from './analyzer/types';
import { getMessages } from './i18n';

export function activate(context: vscode.ExtensionContext) {
  console.log('Extensão "BigON - Analisador de Complexidade Multi-Linguagem" ativada!');

  const engine = new ComplexityEngine();
  const messages = getMessages(vscode.env.language);
  const reportsCache = new Map<string, FunctionComplexityReport[]>();
  const codeLensProvider = new AsymptoticCodeLensProvider(engine, reportsCache);
  const decorationManager = new LineDecorationManager();

  let debounceTimer: NodeJS.Timeout | undefined;

  const selector: vscode.DocumentFilter[] = [
    { scheme: 'file', language: '*' }
  ];

  const isSupportedDocument = (doc: vscode.TextDocument): boolean => {
    const norm = normalizeLanguageId(doc.languageId, doc.fileName);
    return ['javascript', 'typescript', 'python', 'ruby', 'cpp'].includes(norm);
  };

  const analyzeDocument = (doc: vscode.TextDocument): FunctionComplexityReport[] => {
    if (!isSupportedDocument(doc)) {
      return [];
    }
    const normLang = normalizeLanguageId(doc.languageId, doc.fileName);
    const result = engine.analyzeCode(doc.getText(), doc.fileName, normLang, vscode.env.language);
    reportsCache.set(doc.uri.toString(), result.functions);
    return result.functions;
  };

  const getOrAnalyzeReports = (doc: vscode.TextDocument): FunctionComplexityReport[] => {
    const uriStr = doc.uri.toString();
    if (reportsCache.has(uriStr)) {
      return reportsCache.get(uriStr)!;
    }
    return analyzeDocument(doc);
  };

  const codeLensDisposable = vscode.languages.registerCodeLensProvider(selector, codeLensProvider);

  const hoverDisposable = vscode.languages.registerHoverProvider(
    selector,
    new AsymptoticHoverProvider((doc) => getOrAnalyzeReports(doc))
  );

  const updateCurrentEditorAnalysis = (editor: vscode.TextEditor | undefined) => {
    if (!editor) return;
    const doc = editor.document;
    if (!isSupportedDocument(doc)) return;

    const functions = analyzeDocument(doc);
    decorationManager.updateDecorations(editor, functions);
  };

  if (vscode.window.activeTextEditor) {
    updateCurrentEditorAnalysis(vscode.window.activeTextEditor);
  }

  const activeEditorChangeDisposable = vscode.window.onDidChangeActiveTextEditor((editor) => {
    updateCurrentEditorAnalysis(editor);
  });

  const docChangeDisposable = vscode.workspace.onDidChangeTextDocument((event) => {
    if (
      vscode.window.activeTextEditor &&
      event.document === vscode.window.activeTextEditor.document
    ) {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        updateCurrentEditorAnalysis(vscode.window.activeTextEditor);
        codeLensProvider.refresh();
      }, 300);
    }
  });

  const docCloseDisposable = vscode.workspace.onDidCloseTextDocument((doc) => {
    reportsCache.delete(doc.uri.toString());
  });

  const analyzeCmd = vscode.commands.registerCommand('BigON.analyzeFile', () => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      updateCurrentEditorAnalysis(editor);
      codeLensProvider.refresh();
    vscode.window.showInformationMessage(messages.analysisCompleted);
    }
  });

  const toggleDecorationsCmd = vscode.commands.registerCommand('BigON.toggleDecorations', () => {
    const enabled = decorationManager.toggle();
    if (enabled && vscode.window.activeTextEditor) {
      updateCurrentEditorAnalysis(vscode.window.activeTextEditor);
    }
    vscode.window.showInformationMessage(
      enabled ? messages.decorationsOn : messages.decorationsOff
    );
  });

  const openExplanationCmd = vscode.commands.registerCommand(
    'BigON.openExplanation',
    (report?: FunctionComplexityReport) => {
      let reportToOpen = report;

      if (!reportToOpen && vscode.window.activeTextEditor) {
        const editor = vscode.window.activeTextEditor;
        const doc = editor.document;
        const functions = getOrAnalyzeReports(doc);
        if (functions.length > 0) {
          const cursorLine = editor.selection.active.line + 1;
          reportToOpen =
            functions.find((fn) => cursorLine >= fn.startLine && cursorLine <= fn.endLine) ||
            functions.find((fn) => cursorLine <= fn.startLine) ||
            functions[0];
        }
      }

      if (reportToOpen) {
        ExplanationWebviewPanel.show(context.extensionUri, reportToOpen);
      } else {
        vscode.window.showWarningMessage(messages.noFunction);
      }
    }
  );

  context.subscriptions.push(
    codeLensDisposable,
    hoverDisposable,
    activeEditorChangeDisposable,
    docChangeDisposable,
    docCloseDisposable,
    analyzeCmd,
    toggleDecorationsCmd,
    openExplanationCmd,
    decorationManager
  );
}
