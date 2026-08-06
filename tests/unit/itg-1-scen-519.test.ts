import { sendUnreportedReminderNotification } from '../../src/logic/it-1-br-1-1-1';

describe('報告送信時に、送信者本人と部長宛に確認メールを自動配信する機能', () => {
  // SCEN-519: [edge] 未報告部員催促通知機能 - 朝会開始予定時刻の15分前を1秒超過した時点で未報告者が1名以上いる場合、催促メッセージが部長に通知される
  test('朝会開始予定時刻の15分前を1秒超過した時点で未報告者がいる場合、部長に催促メール通知が送信される', () => {
    const morning_meeting_start_time = new Date('2024-01-15T09:00:00Z');
    const fifteen_min_before = new Date('2024-01-15T08:45:00Z');
    const execution_time_before_threshold = new Date('2024-01-15T08:44:59Z');
    const execution_time_after_threshold = new Date('2024-01-15T08:45:01Z');

    const department_head_user = {
      user_id: 'user_dept_head_001',
      user_name: '部長太郎',
      user_email: 'head@example.com',
      department_id: 'dept_dev_001',
      role: 'department_head',
    };

    const reported_members = [
      {
        user_id: 'user_eng_001',
        user_name: '部員A',
        user_email: 'member_a@example.com',
        department_id: 'dept_dev_001',
        role: 'engineer',
        report_submitted: true,
        report_submitted_at: new Date('2024-01-15T08:30:00Z'),
      },
      {
        user_id: 'user_eng_002',
        user_name: '部員B',
        user_email: 'member_b@example.com',
        department_id: 'dept_dev_001',
        role: 'engineer',
        report_submitted: true,
        report_submitted_at: new Date('2024-01-15T08:32:00Z'),
      },
      {
        user_id: 'user_eng_003',
        user_name: '部員C',
        user_email: 'member_c@example.com',
        department_id: 'dept_dev_001',
        role: 'engineer',
        report_submitted: true,
        report_submitted_at: new Date('2024-01-15T08:33:00Z'),
      },
      {
        user_id: 'user_eng_004',
        user_name: '部員D',
        user_email: 'member_d@example.com',
        department_id: 'dept_dev_001',
        role: 'engineer',
        report_submitted: true,
        report_submitted_at: new Date('2024-01-15T08:34:00Z'),
      },
      {
        user_id: 'user_eng_005',
        user_name: '部員E',
        user_email: 'member_e@example.com',
        department_id: 'dept_dev_001',
        role: 'engineer',
        report_submitted: true,
        report_submitted_at: new Date('2024-01-15T08:35:00Z'),
      },
      {
        user_id: 'user_eng_006',
        user_name: '部員F',
        user_email: 'member_f@example.com',
        department_id: 'dept_dev_001',
        role: 'engineer',
        report_submitted: true,
        report_submitted_at: new Date('2024-01-15T08:36:00Z'),
      },
      {
        user_id: 'user_eng_007',
        user_name: '部員G',
        user_email: 'member_g@example.com',
        department_id: 'dept_dev_001',
        role: 'engineer',
        report_submitted: true,
        report_submitted_at: new Date('2024-01-15T08:37:00Z'),
      },
      {
        user_id: 'user_eng_008',
        user_name: '部員H',
        user_email: 'member_h@example.com',
        department_id: 'dept_dev_001',
        role: 'engineer',
        report_submitted: true,
        report_submitted_at: new Date('2024-01-15T08:38:00Z'),
      },
      {
        user_id: 'user_eng_009',
        user_name: '部員I',
        user_email: 'member_i@example.com',
        department_id: 'dept_dev_001',
        role: 'engineer',
        report_submitted: true,
        report_submitted_at: new Date('2024-01-15T08:39:00Z'),
      },
    ];

    const unreported_member = {
      user_id: 'user_eng_010',
      user_name: '部員J',
      user_email: 'member_j@example.com',
      department_id: 'dept_dev_001',
      role: 'engineer',
      report_submitted: false,
      report_submitted_at: null,
    };

    const all_members = [...reported_members, unreported_member];

    const email_log_before = [];
    const email_log_after = [];

    const mock_email_service = {
      send_email: (recipient_email: string, subject: string, body: string): void => {
        const email_record = {
          recipient: recipient_email,
          subject: subject,
          body: body,
          sent_at: new Date('2024-01-15T08:44:59Z'),
        };
        email_log_before.push(email_record);
      },
    };

    const result_before = sendUnreportedReminderNotification(
      {
        meeting_start_time: morning_meeting_start_time,
        current_execution_time: execution_time_before_threshold,
        department_head: department_head_user,
        all_department_members: all_members,
      },
      mock_email_service
    );

    expect(result_before.notification_sent).toBe(false);
    expect(email_log_before.length).toBe(0);

    const mock_email_service_after = {
      send_email: (recipient_email: string, subject: string, body: string): void => {
        const email_record = {
          recipient: recipient_email,
          subject: subject,
          body: body,
          sent_at: execution_time_after_threshold,
        };
        email_log_after.push(email_record);
      },
    };

    const result_after = sendUnreportedReminderNotification(
      {
        meeting_start_time: morning_meeting_start_time,
        current_execution_time: execution_time_after_threshold,
        department_head: department_head_user,
        all_department_members: all_members,
      },
      mock_email_service_after
    );

    expect(result_after.notification_sent).toBe(true);
    expect(result_after.unreported_members_count).toBe(1);
    expect(email_log_after.length).toBe(1);

    const sent_email = email_log_after[0];
    expect(sent_email.recipient).toBe('head@example.com');
    expect(sent_email.subject).toMatch(/未報告者催促通知/);
    expect(sent_email.body).toContain('部員J');
    expect(sent_email.body).toContain('朝会開始予定時刻：09:00');
    expect(sent_email.body).toContain('現在時刻：08:45:01');
  });
});