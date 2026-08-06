import { validateAndRegisterDailyReport } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-158: [edge] 日報送信重複チェック機能 - 月末日から翌月初日に跨る送信では異なる日付として重複チェックされない
  test('月末日から翌月初日に跨る送信では異なる日付として重複チェックされない', () => {
    const user_id = 'user_001';
    const department_id = 'dept_001';

    // 1件目: 2月28日 23時59分の日報送信
    const first_submission_timestamp = new Date('2024-02-28T23:59:00Z');
    const first_report = {
      user_id: user_id,
      department_id: department_id,
      yesterday_achievement: 'タスクA完了',
      today_plan: 'タスクB開始',
      current_issues: '課題1',
      submitted_at: first_submission_timestamp,
    };

    const first_result = validateAndRegisterDailyReport(first_report);
    expect(first_result.is_valid).toBe(true);
    expect(first_result.error_message).toBeNull();
    expect(first_result.is_duplicate).toBe(false);
    expect(first_result.confirmation_emails_sent_count).toBe(1);

    // 2件目: 3月1日 00時01分の日報送信（翌日）
    const second_submission_timestamp = new Date('2024-03-01T00:01:00Z');
    const second_report = {
      user_id: user_id,
      department_id: department_id,
      yesterday_achievement: 'タスクB継続',
      today_plan: 'タスクC開始',
      current_issues: '課題2',
      submitted_at: second_submission_timestamp,
    };

    const second_result = validateAndRegisterDailyReport(second_report);

    // 2件目の送信は重複チェックに引っかからずに受け付けられる
    expect(second_result.is_valid).toBe(true);
    expect(second_result.error_message).toBeNull();
    expect(second_result.is_duplicate).toBe(false);
    expect(second_result.confirmation_emails_sent_count).toBe(1);

    // 送信日時が異なる日付（2月28日と3月1日）であると判定され、
    // 2件目の日報は正常に受け付けられ、システム管理者に2件の確認メールが送信される
    expect(first_result.submitted_date).toBe('2024-02-28');
    expect(second_result.submitted_date).toBe('2024-03-01');
  });
});