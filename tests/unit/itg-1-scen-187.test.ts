import { validateMorningReportSubmission } from '../../src/logic/it-1';

describe('朝会報告送信バリデーション', () => {
  // SCEN-187
  test('項目1が最小許容文字数直下でエラーが発生する', () => {
    const yesterday_report = 'a'.repeat(9);
    const today_report = 'b'.repeat(10);
    const issue_report = 'c'.repeat(10);

    expect(() =>
      validateMorningReportSubmission({
        yesterday_report,
        today_report,
        issue_report,
      })
    ).toThrow(/昨日やったこと/);
  });
});