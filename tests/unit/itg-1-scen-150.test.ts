import { validateDailyReportSubmission } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-150
  test('同一ユーザーが同一日付で2回目の送信を試みたとき送信を拒否する', () => {
    const submission_date = '2024-01-15';
    const user_id = 'user-001';
    
    const first_report = {
      user_id: user_id,
      submission_date: submission_date,
      yesterday_achievement: 'タスクA完了',
      today_plan: 'タスクB開始',
      current_issues: '課題なし',
    };
    
    const second_report = {
      user_id: user_id,
      submission_date: submission_date,
      yesterday_achievement: 'タスクC完了',
      today_plan: 'タスクD開始',
      current_issues: 'なし',
    };
    
    const first_result = validateDailyReportSubmission(first_report);
    expect(first_result.is_allowed).toBe(true);
    expect(first_result.message).toMatch(/送信完了/);
    
    const second_result = validateDailyReportSubmission(second_report);
    expect(second_result.is_allowed).toBe(false);
    expect(second_result.message).toMatch(/既に送信/);
  });
});