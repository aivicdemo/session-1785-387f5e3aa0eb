import { sendReportWithMailLog } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-118
  test('確認メール自動配信機能 - メール送信ログに開発部長宛メールの送信レコードが記録される', async () => {
    const departmentHeadEmail = 'taicho@example.com';
    const reporterId = 'engineer-001';
    const reportDate = '2024-01-15';
    const sendTime = new Date('2024-01-15T09:30:00Z');

    const reportContent = {
      yesterday: '前日のタスク完了',
      today: '本日の予定',
      challenges: '抱えている課題'
    };

    const mockMailLog = {
      id: 'mail-log-001',
      recipient_email: departmentHeadEmail,
      recipient_role: '開発部長',
      subject: '朝会報告確認',
      status: '成功',
      sent_at: sendTime.toISOString(),
      created_at: sendTime.toISOString()
    };

    const result = await sendReportWithMailLog({
      report_id: 'report-001',
      reporter_id: reporterId,
      report_date: reportDate,
      yesterday_result: reportContent.yesterday,
      today_plan: reportContent.today,
      challenges: reportContent.challenges,
      department_head_email: departmentHeadEmail,
      sent_at: sendTime
    });

    expect(result).toEqual(
      expect.objectContaining({
        mail_log: expect.objectContaining({
          recipient_email: departmentHeadEmail,
          recipient_role: '開発部長',
          subject: '朝会報告確認',
          status: '成功'
        }),
        report_sent: true
      })
    );

    expect(result.mail_log.recipient_email).toBe('taicho@example.com');
    expect(result.mail_log.recipient_role).toBe('開発部長');
    expect(result.mail_log.subject).toBe('朝会報告確認');
    expect(result.mail_log.status).toBe('成功');
  });
});