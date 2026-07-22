import * as ts from 'typescript';

export class ASTParser {
  public static parseSource(code: string, fileName: string = 'file.ts'): ts.SourceFile {
    return ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  }
}
