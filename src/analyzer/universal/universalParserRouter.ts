import { UniversalFileAST } from './types';
import { PythonUniversalParser } from './parsers/pythonUniversalParser';
import { RubyUniversalParser } from './parsers/rubyUniversalParser';
import { CppUniversalParser } from './parsers/cppUniversalParser';
import { GoUniversalParser } from './parsers/goUniversalParser';
import { JavaUniversalParser } from './parsers/javaUniversalParser';
import { Messages } from '../../i18n/messages';
import { getMessages } from '../../i18n';

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
  if (lang === 'go' || ext === 'go') return 'go';
  if (lang === 'java' || ext === 'java') return 'java';
  return 'typescript';
}

export class UniversalParserRouter {
  public parse(
    code: string,
    languageId: string,
    fileName: string = '',
    messages: Messages = getMessages('en')
  ): UniversalFileAST {
    const normLang = normalizeLanguageId(languageId, fileName);
    const functions = normLang === 'python'
      ? new PythonUniversalParser(messages).parse(code)
      : normLang === 'ruby'
        ? new RubyUniversalParser(messages).parse(code)
        : normLang === 'cpp'
          ? new CppUniversalParser(messages).parse(code)
          : normLang === 'go'
            ? new GoUniversalParser(messages).parse(code)
            : normLang === 'java'
              ? new JavaUniversalParser(messages).parse(code)
              : [];

    return { functions };
  }
}
