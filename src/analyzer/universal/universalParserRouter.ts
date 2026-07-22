import { UniversalFileAST, UniversalFunctionNode } from './types';
import { PythonUniversalParser } from './parsers/pythonUniversalParser';
import { RubyUniversalParser } from './parsers/rubyUniversalParser';
import { CppUniversalParser } from './parsers/cppUniversalParser';

export function normalizeLanguageId(languageId: string, fileName: string = ''): string {
  const lang = (languageId || '').toLowerCase();
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (lang === 'python' || ext === 'py' || ext === 'pyw') return 'python';
  if (lang === 'ruby' || ext === 'rb') return 'ruby';
  if (
    lang === 'cpp' ||
    lang === 'c' ||
    lang === 'c_cpp' ||
    ['cpp', 'c', 'hpp', 'h', 'cc', 'cxx', 'ino'].includes(ext)
  ) {
    return 'cpp';
  }
  return 'typescript';
}

export class UniversalParserRouter {
  private pythonParser = new PythonUniversalParser();
  private rubyParser = new RubyUniversalParser();
  private cppParser = new CppUniversalParser();

  public parse(code: string, languageId: string, fileName: string = ''): UniversalFileAST {
    let functions: UniversalFunctionNode[] = [];
    const normLang = normalizeLanguageId(languageId, fileName);

    if (normLang === 'python') {
      functions = this.pythonParser.parse(code);
    } else if (normLang === 'ruby') {
      functions = this.rubyParser.parse(code);
    } else if (normLang === 'cpp') {
      functions = this.cppParser.parse(code);
    }

    return {
      languageId: normLang,
      functions,
    };
  }
}
