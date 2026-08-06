import { describe, test, expect } from '@jest/globals';
import { validateMorningReportSubmission } from '../../src/logic/it-1';

describe('日報入力フォームの提出と送信機能', () => {
  // SCEN-168
  test('第1項目が許容最大文字数を超過するとき送信を中断してエラーメッセージを表示する', () => {
    const yesterday_max_char = 500;
    const yesterday_input = 'あ'.repeat(yesterday_max_char + 1);
    const today_input = '本日の予定サンプル';
    const issue_input = '課題サンプル';

    const submission_data = {
      yesterday_achievement: yesterday_input,
      today_plan: today_input,
      current_issue: issue_input,
      user_id: 'user_001',
      submission_date: '2024-01-15',
    };

    const result = validateMorningReportSubmission(submission_data);

    expect(result.is_valid).toBe(false);
    expect(result.error_field).toBe('yesterday_achievement');
    expect(result.error_message).toMatch(/昨日やったこと/);
    expect(result.error_message).toMatch(/500文字/);
    expect(result.is_button_disabled).toBe(true);
    expect(result.should_send_confirmation_email).toBe(false);
  });
});