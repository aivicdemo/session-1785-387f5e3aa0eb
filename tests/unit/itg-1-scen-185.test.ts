import { validateMorningReportSubmission } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-185: [edge] 朝会報告送信バリデーション - 項目3の文字数が最大許容値直上でエラーが発生する
  test('項目3が最大許容文字数を1文字超過した場合、バリデーションエラーメッセージが表示される', () => {
    const yesterday_achievement = '昨日完了したタスクの説明文です。';
    const today_plan = '本日予定されているタスクの説明文です。';
    const issues_text = 'あ'.repeat(1001);

    const result = validateMorningReportSubmission({
      yesterday_achievement,
      today_plan,
      issues_text,
    });

    expect(result.is_valid).toBe(false);
    expect(result.error_messages).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/項目3|1000文字/),
      ])
    );
    expect(result.can_submit).toBe(false);
  });
});