import { sendReportMissingReminderNotification } from '../../src/logic/it-1-br-1-1-1';

const fetchMock = require('jest-fetch-mock');

describe('未報告部員催促通知機能 - 重複除外', () => {
  test('SCEN-523: 未報告者リストに重複名が含まれる場合、重複を除外して一意な部員名のみ通知される', async () => {
    fetchMock.resetMocks();

    const non_reported_members = [
      { user_id: '001', member_name: '部員A', email: 'member_a@example.com' },
      { user_id: '002', member_name: '部員B', email: 'member_b@example.com' },
      { user_id: '001', member_name: '部員A', email: 'member_a@example.com' },
      { user_id: '003', member_name: '部員C', email: 'member_c@example.com' },
      { user_id: '002', member_name: '部員B', email: 'member_b@example.com' },
    ];

    const department_head_email = 'head@example.com';
    const expected_member_list = '部員A、部員B、部員C';

    fetchMock.mockResponseOnce(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { status: 200 }
    );

    const result = await sendReportMissingReminderNotification(
      non_reported_members,
      department_head_email
    );

    expect(fetchMock.mock.calls.length).toBe(1);

    const request_body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(request_body.to).toBe(department_head_email);
    expect(request_body.subject).toContain('未報告部員');
    expect(request_body.body).toContain(expected_member_list);
    expect(result).toEqual({ success: true, message: 'Email sent successfully' });
  });
});