import { submitDailyReport } from '../../src/logic/it-1';

describe('朝会報告送信制御機能', () => {
  test('SCEN-145: 異なるユーザーが同一日付で送信を試みた場合に送信が許可される', () => {
    // Setup: User A submits report
    const userA_id = 'user-a-001';
    const userA_submission_date = '2024-01-15';
    const userA_report_data = {
      user_id: userA_id,
      submission_date: userA_submission_date,
      yesterday_achievement: 'ユーザーAが昨日実施した作業内容',
      today_plan: 'ユーザーAが今日実施する予定内容',
      current_challenges: 'ユーザーAが現在抱えている課題',
    };

    const userA_result = submitDailyReport(userA_report_data);

    expect(userA_result.status).toBe('送信済み');
    expect(userA_result.user_id).toBe(userA_id);
    expect(userA_result.submission_date).toBe(userA_submission_date);
    expect(userA_result.sent_at).toBeDefined();

    // User A logout (implicit in scenario)

    // Setup: User B submits report on same date
    const userB_id = 'user-b-002';
    const userB_submission_date = '2024-01-15'; // Same date as User A
    const userB_report_data = {
      user_id: userB_id,
      submission_date: userB_submission_date,
      yesterday_achievement: 'ユーザーBが昨日実施した作業内容',
      today_plan: 'ユーザーBが今日実施する予定内容',
      current_challenges: 'ユーザーBが現在抱えている課題',
    };

    const userB_result = submitDailyReport(userB_report_data);

    // Verify User B submission succeeds
    expect(userB_result.status).toBe('送信済み');
    expect(userB_result.user_id).toBe(userB_id);
    expect(userB_result.submission_date).toBe(userB_submission_date);
    expect(userB_result.sent_at).toBeDefined();

    // Verify no conflict with User A's submission
    expect(userB_result.user_id).not.toBe(userA_id);

    // Verify confirmation email content structure for User B
    expect(userB_result.confirmation_email).toBeDefined();
    expect(userB_result.confirmation_email.recipient_type).toBe('管理者');
    expect(userB_result.confirmation_email.body).toContain(userB_report_data.yesterday_achievement);
    expect(userB_result.confirmation_email.body).toContain(userB_report_data.today_plan);
    expect(userB_result.confirmation_email.body).toContain(userB_report_data.current_challenges);
  });
});