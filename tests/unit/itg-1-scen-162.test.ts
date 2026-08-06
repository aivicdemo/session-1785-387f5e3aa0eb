import { validateAndSubmitMorningReport } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-162
  test('第1項目が空文字列のとき送信を中断してエラーメッセージを表示する', () => {
    const input_yesterday_accomplishment = '';
    const input_today_plan = 'タスクA実施';
    const input_current_issues = '課題なし';
    const user_id = 'user_001';
    const submission_date = new Date('2024-01-15T09:00:00Z');

    const result = validateAndSubmitMorningReport({
      yesterday_accomplishment: input_yesterday_accomplishment,
      today_plan: input_today_plan,
      current_issues: input_current_issues,
      user_id: user_id,
      submission_date: submission_date,
    });

    expect(result.is_valid).toBe(false);
    expect(result.error_message).toMatch(/昨日やったこと/);
    expect(result.confirmation_email_sent).toBe(false);
  });
});