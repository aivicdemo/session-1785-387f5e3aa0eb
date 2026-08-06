import { validateReportCompletionRequirements } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-355
  test('全員報告完了判定機能 - 期待報告人数が null のとき、エラーが発生する', () => {
    const expectedReporterCount = null;

    expect(() => {
      validateReportCompletionRequirements({
        expectedReporterCount: expectedReporterCount as any,
      });
    }).toThrow(/期待報告人数/);
  });
});