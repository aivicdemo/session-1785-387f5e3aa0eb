import { sendConfirmationEmailsToBothRecipients } from '../../src/logic/it-1-br-1-1-1';

describe('it-1-br-1-1-1: 報告送信時に送信者本人と部長宛に確認メールを自動配信', () => {
  // SCEN-244: 同一日報内容を複数部員が送信した場合に同値データとして正しく区別される
  test('should distinguish identical report content by different senders with different metadata', () => {
    fetchMock.resetMocks();

    const employeeA_id = 'EMP001';
    const employeeB_id = 'EMP002';
    const department_head_id = 'MGR001';
    const fixed_timestamp_a = new Date('2024-01-15T08:30:00Z');
    const fixed_timestamp_b = new Date('2024-01-15T08:32:00Z');

    const shared_report_content = {
      yesterday_accomplishment: 'バグ修正完了',
      today_plan: 'レビュー実施',
      current_challenge: 'データベース接続タイムアウト',
    };

    const report_from_employee_a = {
      employee_id: employeeA_id,
      department_head_id: department_head_id,
      report_content: shared_report_content,
      submission_timestamp: fixed_timestamp_a,
      report_date: '2024-01-15',
    };

    const report_from_employee_b = {
      employee_id: employeeB_id,
      department_head_id: department_head_id,
      report_content: shared_report_content,
      submission_timestamp: fixed_timestamp_b,
      report_date: '2024-01-15',
    };

    // Mock email sending API responses
    fetchMock.mockResponseOnce(JSON.stringify({ success: true, message_id: 'MSG_A_SELF' }), {
      status: 200,
    });
    fetchMock.mockResponseOnce(JSON.stringify({ success: true, message_id: 'MSG_A_HEAD' }), {
      status: 200,
    });
    fetchMock.mockResponseOnce(JSON.stringify({ success: true, message_id: 'MSG_B_SELF' }), {
      status: 200,
    });
    fetchMock.mockResponseOnce(JSON.stringify({ success: true, message_id: 'MSG_B_HEAD' }), {
      status: 200,
    });

    // Execute: send confirmation emails for both employees
    const result_a = sendConfirmationEmailsToBothRecipients(report_from_employee_a);
    const result_b = sendConfirmationEmailsToBothRecipients(report_from_employee_b);

    // Verify: Both reports have same content but different sender metadata
    expect(result_a.report_content.yesterday_accomplishment).toBe(
      shared_report_content.yesterday_accomplishment
    );
    expect(result_a.report_content.today_plan).toBe(shared_report_content.today_plan);
    expect(result_a.report_content.current_challenge).toBe(
      shared_report_content.current_challenge
    );

    expect(result_b.report_content.yesterday_accomplishment).toBe(
      shared_report_content.yesterday_accomplishment
    );
    expect(result_b.report_content.today_plan).toBe(shared_report_content.today_plan);
    expect(result_b.report_content.current_challenge).toBe(
      shared_report_content.current_challenge
    );

    // Verify: Sender IDs are different
    expect(result_a.employee_id).toBe(employeeA_id);
    expect(result_b.employee_id).toBe(employeeB_id);
    expect(result_a.employee_id).not.toBe(result_b.employee_id);

    // Verify: Submission timestamps are different
    expect(result_a.submission_timestamp).toEqual(fixed_timestamp_a);
    expect(result_b.submission_timestamp).toEqual(fixed_timestamp_b);
    expect(result_a.submission_timestamp).not.toEqual(result_b.submission_timestamp);

    // Verify: Both reports have same report date
    expect(result_a.report_date).toBe('2024-01-15');
    expect(result_b.report_date).toBe('2024-01-15');

    // Verify: Confirmation emails sent to both sender and department head (4 emails total: 2 per sender)
    expect(fetchMock.mock.calls.length).toBe(4);

    // Verify: First email for employee A (to self)
    expect(fetchMock.mock.calls[0][0]).toContain('/send-email');
    const call_0_body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
    expect(call_0_body.recipient_email).toBeDefined();
    expect(call_0_body.report_content).toEqual(shared_report_content);
    expect(call_0_body.sender_id).toBe(employeeA_id);

    // Verify: Second email for employee A (to department head)
    expect(fetchMock.mock.calls[1][0]).toContain('/send-email');
    const call_1_body = JSON.parse(fetchMock.mock.calls[1][1]?.body as string);
    expect(call_1_body.recipient_id).toBe(department_head_id);
    expect(call_1_body.report_content).toEqual(shared_report_content);
    expect(call_1_body.sender_id).toBe(employeeA_id);

    // Verify: Third email for employee B (to self)
    expect(fetchMock.mock.calls[2][0]).toContain('/send-email');
    const call_2_body = JSON.parse(fetchMock.mock.calls[2][1]?.body as string);
    expect(call_2_body.recipient_email).toBeDefined();
    expect(call_2_body.report_content).toEqual(shared_report_content);
    expect(call_2_body.sender_id).toBe(employeeB_id);

    // Verify: Fourth email for employee B (to department head)
    expect(fetchMock.mock.calls[3][0]).toContain('/send-email');
    const call_3_body = JSON.parse(fetchMock.mock.calls[3][1]?.body as string);
    expect(call_3_body.recipient_id).toBe(department_head_id);
    expect(call_3_body.report_content).toEqual(shared_report_content);
    expect(call_3_body.sender_id).toBe(employeeB_id);

    // Verify: Both reports are distinguishable in the system
    expect(result_a.submission_timestamp.getTime()).toBe(fixed_timestamp_a.getTime());
    expect(result_b.submission_timestamp.getTime()).toBe(fixed_timestamp_b.getTime());
    expect(result_a.submission_timestamp.getTime()).not.toBe(result_b.submission_timestamp.getTime());

    // Verify: Return indicates successful email dispatch for both senders and recipients
    expect(result_a.emails_sent).toBe(2);
    expect(result_b.emails_sent).toBe(2);
  });
});