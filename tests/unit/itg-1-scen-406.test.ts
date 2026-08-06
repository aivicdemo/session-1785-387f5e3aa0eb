import { notifyUnreportedMembers } from '../../src/logic/it-1-br-1-1-1';

describe('朝会報告システム - 未提出部員通知機能', () => {
  // SCEN-406: [normal] 未提出部員通知機能 - 催促ループ終了時に、報告未提出部員が複数件の場合、部長に通知される
  test('should send notification email to manager with unreported members and missing report types when final reminder loop ends', () => {
    const report_submission_deadline = new Date('2024-01-15T09:00:00Z');
    const final_reminder_execution_time = new Date('2024-01-15T08:50:00Z');
    const current_time = new Date('2024-01-15T08:50:30Z');

    const members = [
      { user_id: 'ENG001', user_name: 'エンジニア太郎', department_id: 'DEV' },
      { user_id: 'ENG002', user_name: 'エンジニア花子', department_id: 'DEV' },
      { user_id: 'ENG003', user_name: 'エンジニア次郎', department_id: 'DEV' },
      { user_id: 'ENG004', user_name: 'エンジニア美咲', department_id: 'DEV' },
      { user_id: 'ENG005', user_name: 'エンジニア健太', department_id: 'DEV' },
      { user_id: 'ENG006', user_name: 'エンジニア由美', department_id: 'DEV' },
      { user_id: 'ENG007', user_name: 'エンジニア光太', department_id: 'DEV' },
      { user_id: 'ENG008', user_name: 'エンジニア麻衣', department_id: 'DEV' },
      { user_id: 'ENG009', user_name: 'エンジニア翔太', department_id: 'DEV' },
      { user_id: 'ENG010', user_name: 'エンジニア結衣', department_id: 'DEV' },
    ];

    const submitted_report_ids = [
      'ENG004',
      'ENG005',
      'ENG006',
      'ENG007',
      'ENG008',
      'ENG009',
      'ENG010',
    ];

    const unreported_member_ids = [
      'ENG001',
      'ENG002',
      'ENG003',
    ];

    const unreported_members = members.filter(
      m => unreported_member_ids.includes(m.user_id)
    );

    const unreported_details = [
      {
        user_id: 'ENG001',
        user_name: 'エンジニア太郎',
        missing_report_types: ['昨日やったこと', '今日やること', '抱えている課題'],
      },
      {
        user_id: 'ENG002',
        user_name: 'エンジニア花子',
        missing_report_types: ['昨日やったこと', '今日やること'],
      },
      {
        user_id: 'ENG003',
        user_name: 'エンジニア次郎',
        missing_report_types: ['抱えている課題'],
      },
    ];

    const manager_user_id = 'MGR001';
    const manager_email = 'manager@example.com';

    const mock_send_email = jest.fn().mockResolvedValue({
      email_id: 'EMAIL001',
      sent_at: current_time,
      status: 'sent',
    });

    const input_params = {
      submission_deadline: report_submission_deadline,
      final_reminder_execution_time: final_reminder_execution_time,
      current_time: current_time,
      unreported_members_detail: unreported_details,
      manager_user_id: manager_user_id,
      manager_email: manager_email,
      send_email_fn: mock_send_email,
    };

    const result = notifyUnreportedMembers(input_params);

    expect(mock_send_email).toHaveBeenCalledTimes(1);
    expect(mock_send_email).toHaveBeenCalledWith(
      expect.objectContaining({
        recipient_email: manager_email,
        recipient_user_id: manager_user_id,
      })
    );

    const email_call_args = mock_send_email.mock.calls[0][0];
    expect(email_call_args.email_subject).toMatch(/報告/);
    expect(email_call_args.email_body).toContain('エンジニア太郎');
    expect(email_call_args.email_body).toContain('ENG001');
    expect(email_call_args.email_body).toContain('エンジニア花子');
    expect(email_call_args.email_body).toContain('ENG002');
    expect(email_call_args.email_body).toContain('エンジニア次郎');
    expect(email_call_args.email_body).toContain('ENG003');

    expect(email_call_args.email_body).toContain('昨日やったこと');
    expect(email_call_args.email_body).toContain('今日やること');
    expect(email_call_args.email_body).toContain('抱えている課題');

    expect(result).toEqual(
      expect.objectContaining({
        notification_sent: true,
        notification_email_id: 'EMAIL001',
        unreported_members_count: 3,
        unreported_member_ids: ['ENG001', 'ENG002', 'ENG003'],
        notification_sent_timestamp: current_time,
      })
    );
  });
});