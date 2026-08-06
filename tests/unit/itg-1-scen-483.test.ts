import { validateReportContent } from '../../src/logic/it-1';

describe('報告内容検証・集約機能', () => {
  // SCEN-483
  test('今日やることが空文字列の場合にエラーになる', () => {
    const report_data = {
      yesterday_accomplishment: 'タスクA完了',
      today_plan: '',
      current_challenges: 'タスクB検討中',
      user_id: 'user-001',
      submission_date: '2024-01-15',
    };

    const validation_result = validateReportContent(report_data);

    expect(validation_result.is_valid).toBe(false);
    expect(validation_result.error_message).toMatch(/今日やること/);
    expect(validation_result.error_message).toMatch(/必須/);
    expect(validation_result.should_send_confirmation_email).toBe(false);
    expect(validation_result.should_register_submission).toBe(false);
  });
});