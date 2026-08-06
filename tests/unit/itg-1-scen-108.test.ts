import { validateAndSendReport } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-108: [edge] 朝会報告送信検証機能 - 本日の予定が空文字列で送信を中止
  test('should reject submission when challenge field is empty string', () => {
    const report_input = {
      user_id: 'ENG001',
      yesterday_achievement: 'Completed database migration',
      todays_plan: 'Review PR and update docs',
      challenge: '',
    };

    const result = validateAndSendReport(report_input);

    expect(result.success).toBe(false);
    expect(result.error_message).toMatch(/抱えている課題/);
    expect(result.error_message).toMatch(/必須/);
    expect(result.email_sent).toBe(false);
    expect(result.database_record_created).toBe(false);
  });
});