import { getMessages } from '../src/i18n';

describe('i18n', () => {
  test('usa inglês como padrão e fallback', () => {
    expect(getMessages('en-US').time).toBe('Time');
    expect(getMessages('es-ES').time).toBe('Time');
  });

  test('seleciona português para locales pt', () => {
    expect(getMessages('pt-BR').time).toBe('Tempo');
    expect(getMessages('pt-PT').space).toBe('Espaço');
    expect(getMessages('pt-BR').htmlLang).toBe('pt-BR');
    expect(getMessages('pt-BR').growthCurvesTitle).toContain('Curvas de Crescimento');
    expect(getMessages('pt-BR').whatIsBigOTitle).toContain('O que é');
    expect(getMessages('pt-BR').loopLinear).toContain('linear');
    expect(getMessages('pt-BR').loopLevel(2)).toBe('Laço nível 2');
    expect(getMessages('pt-BR').masterTheoremMergeSort(2)).toContain('Teorema Mestre');
  });

  test('fornece chaves em inglês completas para locales en', () => {
    const en = getMessages('en');
    expect(en.htmlLang).toBe('en');
    expect(en.viewExplanation).toBe('View Explanation');
    expect(en.growthCurvesTitle).toContain('Asymptotic Growth Curves');
    expect(en.whatIsBigOTitle).toContain('What is');
    expect(en.loopLinear).toContain('linear');
    expect(en.loopLevel(2)).toBe('Loop level 2');
    expect(en.masterTheoremMergeSort(2)).toContain('Master Theorem');
  });
});
