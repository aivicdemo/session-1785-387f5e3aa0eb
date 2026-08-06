import { validateMorningReportSubmission } from '../../src/logic/it-1';

describe('朝会報告送信バリデーション', () => {
  // SCEN-169
  test('第2項目が許容最大文字数を超過するとき送信を中断してエラーメッセージを表示する', () => {
    const yesterday_accomplishment = '昨日の業務を完了しました';
    const todays_plan = 'あ'.repeat(501);
    const current_issue = '対応が必要な課題があります';

    expect(() => {
      validateMorningReportSubmission({
        yesterday_accomplishment,
        todays_plan,
        current_issue,
      });
    }).toThrow(/今日やること/);
  });
});