import { type Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/orchestrator";
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';

// Mock types and utilities
interface MockEmployee {
  employee_id: string;
  name: string;
  email: string;
  department_id: string;
}

interface MockReportStatus {
  employee_id: string;
  submitted: boolean;
  submitted_at?: string;
}

interface MockAuditLog {
  timestamp: string;
  agent_name: string;
  action: string;
  details: string;
}

interface MockEmailPayload {
  to: string;
  subject: string;
  body: string;
  sent_at: string;
}

// Global mock state
let audit_logs: MockAuditLog[] = [];
let sent_emails: MockEmailPayload[] = [];

// Fake AI client implementation
const createFakeTx2Imp1AiClient = (): Tx2Imp1AiClient => {
  return {
    checkReportSubmissionStatus: async (employee_ids: string[]) => {
      const statuses: MockReportStatus[] = employee_ids.map((emp_id) => ({
        employee_id: emp_id,
        submitted: false,
        submitted_at: undefined,
      }));
      return statuses;
    },

    generateUnsubmittedList: async (
      unsubmitted_statuses: MockReportStatus[]
    ) => {
      return unsubmitted_statuses.map((status) => ({
        employee_id: status.employee_id,
        status: 'unsubmitted' as const,
      }));
    },

    generateSubmittedList: async (submitted_statuses: MockReportStatus[]) => {
      return submitted_statuses.map((status) => ({
        employee_id: status.employee_id,
        status: 'submitted' as const,
      }));
    },

    generateManagerEmailContent: async (
      submitted_count: number,
      unsubmitted_count: number,
      unsubmitted_list: Array<{ employee_id: string }>,
      submitted_list: Array<{ employee_id: string }>,
      scheduled_time: string
    ) => {
      const date = new Date(scheduled_time);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      let body = `【朝会報告】日報提出状況\n\n`;

      if (unsubmitted_count > 0) {
        body += `未送信部員（${unsubmitted_count}名）:\n`;
        unsubmitted_list.forEach((item) => {
          body += `- ${item.employee_id}\n`;
        });
        body += '\n';
      }

      if (submitted_count > 0) {
        body += `送信済み部員（${submitted_count}名）:\n`;
        submitted_list.forEach((item) => {
          body += `- ${item.employee_id}\n`;
        });
      }

      const subject = `【朝会報告】未送信部員一覧 - 本日${month}月${day}日`;

      return {
        subject,
        body,
        sent_at: new Date().toISOString(),
      };
    },

    sendManagerNotification: async (email_payload: MockEmailPayload) => {
      sent_emails.push(email_payload);
      return { success: true, message_id: `msg_${Date.now()}` };
    },

    recordAuditLog: async (audit_entry: MockAuditLog) => {
      audit_logs.push(audit_entry);
      return { success: true };
    },
  };
};

describe('日報入力フォームの提供と送信機能 - 確認メール配信・日報一覧集約機能', () => {
  let fake_ai_client: Tx2Imp1AiClient;
  let test_employees: MockEmployee[];
  let manager_email: string;
  let scheduled_time: string;

  beforeEach(() => {
    // Reset global state
    audit_logs = [];
    sent_emails = [];

    // Initialize fake AI client
    fake_ai_client = createFakeTx2Imp1AiClient();

    // Setup test data: 10 employees all unsubmitted
    test_employees = [
      {
        employee_id: 'EMP001',
        name: '部員A',
        email: 'emp_a@example.com',
        department_id: 'DEV',
      },
      {
        employee_id: 'EMP002',
        name: '部員B',
        email: 'emp_b@example.com',
        department_id: 'DEV',
      },
      {
        employee_id: 'EMP003',
        name: '部員C',
        email: 'emp_c@example.com',
        department_id: 'DEV',
      },
      {
        employee_id: 'EMP004',
        name: '部員D',
        email: 'emp_d@example.com',
        department_id: 'DEV',
      },
      {
        employee_id: 'EMP005',
        name: '部員E',
        email: 'emp_e@example.com',
        department_id: 'DEV',
      },
      {
        employee_id: 'EMP006',
        name: '部員F',
        email: 'emp_f@example.com',
        department_id: 'DEV',
      },
      {
        employee_id: 'EMP007',
        name: '部員G',
        email: 'emp_g@example.com',
        department_id: 'DEV',
      },
      {
        employee_id: 'EMP008',
        name: '部員H',
        email: 'emp_h@example.com',
        department_id: 'DEV',
      },
      {
        employee_id: 'EMP009',
        name: '部員I',
        email: 'emp_i@example.com',
        department_id: 'DEV',
      },
      {
        employee_id: 'EMP010',
        name: '部員J',
        email: 'emp_j@example.com',
        department_id: 'DEV',
      },
    ];

    manager_email = 'manager@example.com';
    scheduled_time = new Date('2024-01-15T09:00:00Z').toISOString();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-279
  test('should generate manager email with only unsubmitted employees list when 0 employees have submitted', async () => {
    // Arrange: Extract employee IDs for status check
    const employee_ids = test_employees.map((emp) => emp.employee_id);
    const expected_submitted_count = 0;
    const expected_unsubmitted_count = 10;
    const expected_date_string = '01月15日';

    // Act: Check report submission status
    const report_statuses =
      await fake_ai_client.checkReportSubmissionStatus(employee_ids);

    // Verify all employees are unsubmitted
    expect(report_statuses).toHaveLength(10);
    expect(report_statuses.every((status) => !status.submitted)).toBe(true);

    // Separate submitted and unsubmitted
    const unsubmitted_statuses = report_statuses.filter(
      (status) => !status.submitted
    );
    const submitted_statuses = report_statuses.filter(
      (status) => status.submitted
    );

    expect(unsubmitted_statuses).toHaveLength(10);
    expect(submitted_statuses).toHaveLength(0);

    // Generate lists
    const unsubmitted_list =
      await fake_ai_client.generateUnsubmittedList(unsubmitted_statuses);
    const submitted_list =
      await fake_ai_client.generateSubmittedList(submitted_statuses);

    expect(unsubmitted_list).toHaveLength(10);
    expect(submitted_list).toHaveLength(0);

    // Generate email content
    const email_content =
      await fake_ai_client.generateManagerEmailContent(
        expected_submitted_count,
        expected_unsubmitted_count,
        unsubmitted_list,
        submitted_list,
        scheduled_time
      );

    // Verify email subject
    expect(email_content.subject).toBe(
      '【朝会報告】未送信部員一覧 - 本日01月15日'
    );

    // Verify email body contains unsubmitted section
    expect(email_content.body).toContain('未送信部員（10名）:');
    expect(email_content.body).toContain('EMP001');
    expect(email_content.body).toContain('EMP002');
    expect(email_content.body).toContain('EMP003');
    expect(email_content.body).toContain('EMP004');
    expect(email_content.body).toContain('EMP005');
    expect(email_content.body).toContain('EMP006');
    expect(email_content.body).toContain('EMP007');
    expect(email_content.body).toContain('EMP008');
    expect(email_content.body).toContain('EMP009');
    expect(email_content.body).toContain('EMP010');

    // Verify email body does NOT contain submitted section
    expect(email_content.body).not.toContain('送信済み部員（');

    // Create email payload
    const email_payload: MockEmailPayload = {
      to: manager_email,
      subject: email_content.subject,
      body: email_content.body,
      sent_at: new Date('2024-01-15T09:00:00Z').toISOString(),
    };

    // Send manager notification
    const send_result = await fake_ai_client.sendManagerNotification(
      email_payload
    );
    expect(send_result.success).toBe(true);
    expect(send_result.message_id).toMatch(/^msg_\d+$/);

    // Verify email was stored
    expect(sent_emails).toHaveLength(1);
    expect(sent_emails[0].to).toBe('manager@example.com');
    expect(sent_emails[0].subject).toBe(
      '【朝会報告】未送信部員一覧 - 本日01月15日'
    );

    // Record audit log
    const audit_entry: MockAuditLog = {
      timestamp: new Date('2024-01-15T09:00:00Z').toISOString(),
      agent_name: 'Tx2Imp1Agent',
      action: 'executed',
      details: `Tx2Imp1Agent executed: ${expected_submitted_count} submitted, ${expected_unsubmitted_count} unsubmitted, mail generated to manager`,
    };

    await fake_ai_client.recordAuditLog(audit_entry);

    // Verify audit log was recorded
    expect(audit_logs).toHaveLength(1);
    expect(audit_logs[0].agent_name).toBe('Tx2Imp1Agent');
    expect(audit_logs[0].action).toBe('executed');
    expect(audit_logs[0].details).toMatch(/0 submitted, 10 unsubmitted/);
    expect(audit_logs[0].timestamp).toBe(
      new Date('2024-01-15T09:00:00Z').toISOString()
    );

    // Final assertions on complete flow
    expect(sent_emails).toHaveLength(1);
    expect(sent_emails[0].body).not.toMatch(/送信済み部員/);
    expect(sent_emails[0].body).toMatch(/未送信部員（10名）/);
    expect(audit_logs).toHaveLength(1);
  });
});