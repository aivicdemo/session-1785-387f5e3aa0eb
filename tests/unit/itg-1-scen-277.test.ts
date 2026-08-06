import { sendConfirmationEmailsOnReporting } from '../../src/logic/it-1-br-1-1-1';

describe('朝会報告送信時に送信者本人と部長宛に確認メールを自動配信する機能', () => {
  // SCEN-277: [edge] 朝会報告送信時刻判定機能 - 送信時刻のナノ秒単位の端数が遅延判定に影響しない
  test('送信時刻のナノ秒端数が無視されマイクロ秒精度で判定され、期限内なら確認メール送信が進行する', () => {
    const submission_user_id = 'ENG-001';
    const submission_timestamp_str = '2024-01-15T08:30:45.123456789Z';
    const submission_timestamp = new Date(submission_timestamp_str);
    const department_head_email = 'head@example.com';
    const submission_user_email = 'engineer@example.com';
    const submission_content = {
      yesterday_achievement: '前日タスク完了',
      today_plan: '本日予定実施',
      current_issues: 'リスク対応中'
    };
    const deadline_start_time = new Date('2024-01-15T08:00:00.000000000Z');
    const deadline_end_time = new Date('2024-01-15T09:00:00.000000000Z');

    const sent_emails = [];
    const email_send_hook = (to_email, subject, body) => {
      sent_emails.push({ to_email, subject, body });
    };

    const result = sendConfirmationEmailsOnReporting(
      submission_user_id,
      submission_timestamp,
      submission_user_email,
      department_head_email,
      submission_content,
      deadline_start_time,
      deadline_end_time,
      email_send_hook
    );

    expect(result.is_within_deadline).toBe(true);
    expect(result.is_nanosecond_truncated).toBe(true);
    expect(sent_emails.length).toBe(2);

    const email_to_submitter = sent_emails.find(e => e.to_email === submission_user_email);
    expect(email_to_submitter).toBeDefined();
    expect(email_to_submitter.subject).toMatch(/確認/);
    expect(email_to_submitter.body).toContain('前日タスク完了');
    expect(email_to_submitter.body).toContain('本日予定実施');
    expect(email_to_submitter.body).toContain('リスク対応中');

    const email_to_head = sent_emails.find(e => e.to_email === department_head_email);
    expect(email_to_head).toBeDefined();
    expect(email_to_head.subject).toMatch(/確認/);
    expect(email_to_head.body).toContain('前日タスク完了');
    expect(email_to_head.body).toContain('本日予定実施');
    expect(email_to_head.body).toContain('リスク対応中');

    expect(result.sent_at_timestamp).toEqual(submission_timestamp);
    expect(result.email_delivery_status).toBe('success');
  });
});