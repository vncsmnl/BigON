import * as ts from 'typescript';
import { BigOComplexity } from './types';
import { RecursionAnalysisResult } from './recursionAnalyzer';
import { Messages } from '../i18n/messages';
import { getMessages } from '../i18n';

export class SpaceAnalyzer {
  constructor(private sourceFile: ts.SourceFile, private messages: Messages = getMessages('en')) {}

  public analyzeSpace(
    functionNode: ts.Node,
    recursionInfo: RecursionAnalysisResult
  ): { spaceComplexity: BigOComplexity; explanation: string } {
    let spaceComplexity: BigOComplexity = 'O(1)';
    let explanation = this.messages.spaceConstant;

    if (recursionInfo.isRecursive) {
      if (recursionInfo.reductionType === 'division') {
        spaceComplexity = 'O(log n)';
        explanation = this.messages.spaceStackLog;
      } else {
        spaceComplexity = 'O(n)';
        explanation = this.messages.spaceStackLinear;
      }
    }

    const bodyText = this.getDirectFunctionText(functionNode);
    if (
      bodyText.includes('new Array(') ||
      bodyText.includes('.fill(') ||
      bodyText.includes('Array.from') ||
      bodyText.includes('new Matrix') ||
      bodyText.includes('.push(')
    ) {
      if (
        (bodyText.includes('new Array(') && bodyText.includes('.map(')) ||
        bodyText.includes('matrix') ||
        bodyText.includes('tabulation')
      ) {
        if (spaceComplexity === 'O(1)' || spaceComplexity === 'O(n)' || spaceComplexity === 'O(log n)') {
          spaceComplexity = 'O(n^2)';
          explanation = this.messages.spaceMatrix;
        }
      } else {
        if (spaceComplexity === 'O(1)') {
          spaceComplexity = 'O(n)';
          explanation = this.messages.spaceVector;
        }
      }
    }

    return { spaceComplexity, explanation };
  }

  private getDirectFunctionText(node: ts.Node): string {
    let directText = '';
    const visit = (child: ts.Node) => {
      if (
        child !== node &&
        (ts.isFunctionDeclaration(child) ||
          ts.isFunctionExpression(child) ||
          ts.isArrowFunction(child) ||
          ts.isMethodDeclaration(child))
      ) {
        return;
      }
      directText += ' ' + child.getText(this.sourceFile);
    };
    ts.forEachChild(node, visit);
    return directText.length > 0 ? directText : node.getText(this.sourceFile);
  }
}
