import { sendConfirmationEmailsToSubmitterAndDirector } from '../../src/logic/it-1-br-1-1-1';

describe('報告送信時に、送信者本人と部長宛に確認メールを自動配信する機能', () => {
  // SCEN-439: [edge] 未提出部員通知機能 - 朝会開始前の月末日時点で催促ループが終了した場合、未提出部員リストが正しく構成される
  test('should return correct unsubmitted employee list when urge loop ends before morning meeting on last day of month', () => {
    const meeting_start_time_scheduled = new Date('2024-01-31T09:00:00Z');
    const current_time_for_test = new Date('2024-01-31T08:30:00Z');
    
    const submitted_employees = [
      { employee_id: 'EMP001', employee_name: 'Alice' },
      { employee_id: 'EMP002', employee_name: 'Bob' },
      { employee_id: 'EMP003', employee_name: 'Charlie' },
      { employee_id: 'EMP004', employee_name: 'David' },
      { employee_id: 'EMP005', employee_name: 'Eve' },
      { employee_id: 'EMP006', employee_name: 'Frank' },
      { employee_id: 'EMP007', employee_name: 'Grace' },
    ];

    const unsubmitted_employees = [
      { employee_id: 'EMP008', employee_name: 'Henry' },
      { employee_id: 'EMP009', employee_name: 'Ivy' },
      { employee_id: 'EMP010', employee_name: 'Jack' },
    ];

    const all_employees = [...submitted_employees, ...unsubmitted_employees];

    const submitted_report_ids = ['REPORT001', 'REPORT002', 'REPORT003', 'REPORT004', 'REPORT005', 'REPORT006', 'REPORT007'];

    const director_email = 'director@example.com';
    const submitter_email = 'alice@example.com';

    const email_send_log = [];
    const mock_email_service = {
      send_email: (to_address: string, subject: string, body: string) => {
        email_send_log.push({ to: to_address, subject, body });
        return true;
      },
    };

    const result = sendConfirmationEmailsToSubmitterAndDirector(
      {
        submission_report_id: 'REPORT001',
        submitter_employee_id: 'EMP001',
        submitter_email_address: submitter_email,
        report_content: {
          yesterday_achievement: 'Completed task A',
          todays_plan: 'Start task B',
          current_issues: 'Blocked by dependency X',
        },
        director_employee_id: 'DIR001',
        director_email_address: director_email,
        meeting_start_time_scheduled,
        current_time: current_time_for_test,
        all_employees,
        submitted_report_ids,
        unsubmitted_employees,
        email_service: mock_email_service,
        urge_loop_end_flag: true,
      }
    );

    expect(result.confirmation_emails_sent).toBe(true);
    expect(result.emails_sent_count).toBe(2);
    expect(email_send_log).toHaveLength(2);

    const submitter_email_log = email_send_log.find(e => e.to === submitter_email);
    expect(submitter_email_log).toBeDefined();
    expect(submitter_email_log?.subject).toMatch(/確認|報告/);

    const director_email_log = email_send_log.find(e => e.to === director_email);
    expect(director_email_log).toBeDefined();
    expect(director_email_log?.subject).toMatch(/確認|報告/);

    expect(result.unsubmitted_employee_list).toHaveLength(3);
    expect(result.unsubmitted_employee_list.map(e => e.employee_id)).toEqual(['EMP008', 'EMP009', 'EMP010']);
    expect(result.unsubmitted_employee_list.map(e => e.employee_name)).toEqual(['Henry', 'Ivy', 'Jack']);

    const submitted_ids_in_unsubmitted_list = result.unsubmitted_employee_list.filter(e =>
      submitted_report_ids.includes(e.employee_id)
    );
    expect(submitted_ids_in_unsubmitted_list).toHaveLength(0);

    expect(result.unsubmitted_employee_count).toBe(3);
    expect(result.submitted_employee_count).toBe(7);
    expect(result.total_employee_count).toBe(10);
  });
});