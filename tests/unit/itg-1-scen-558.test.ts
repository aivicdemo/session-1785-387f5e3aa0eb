import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { runTx3Imp1Agent } from '../../src/logic/it-1';

const fetchMock = require('jest-fetch-mock');

describe('日報入力フォームの提供と送信機能 - 報告漏れ特定から催促送信までの自動実行', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    jest.clearAllMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-558: [normal] 報告漏れ特定から催促送信までの自動実行 AIエージェント
  test('未提出部員4名に対して催促メール・チャットが自動送信され、送信履歴に記録される', async () => {
    const test_start_time = new Date('2024-01-15T08:55:00Z');
    const meeting_start_time = new Date('2024-01-15T09:00:00Z');
    const report_deadline_offset_minutes = 5;

    const non_reporting_employee_ids = ['E001', 'E002', 'E003', 'E004'];
    const reporting_employee_ids = ['E005', 'E006', 'E007', 'E008', 'E009', 'E010'];

    const confirmation_email_content = {
      timestamp: test_start_time.toISOString(),
      meeting_start_time: meeting_start_time.toISOString(),
      non_reporting_employees: [
        {
          employee_id: 'E001',
          employee_name: 'Alice Johnson',
          department: 'Development',
          last_check_time: test_start_time.toISOString(),
        },
        {
          employee_id: 'E002',
          employee_name: 'Bob Smith',
          department: 'Development',
          last_check_time: test_start_time.toISOString(),
        },
        {
          employee_id: 'E003',
          employee_name: 'Carol Williams',
          department: 'Development',
          last_check_time: test_start_time.toISOString(),
        },
        {
          employee_id: 'E004',
          employee_name: 'David Brown',
          department: 'Development',
          last_check_time: test_start_time.toISOString(),
        },
      ],
      reporting_employees: reporting_employee_ids.map((emp_id, idx) => ({
        employee_id: emp_id,
        employee_name: `Employee ${emp_id}`,
        department: 'Development',
        report_submitted_at: new Date(test_start_time.getTime() - 5 * 60 * 1000).toISOString(),
      })),
    };

    const escalation_rule = {
      time_threshold_minutes: report_deadline_offset_minutes,
      meeting_start_time: meeting_start_time.toISOString(),
      current_time: test_start_time.toISOString(),
    };

    const send_history_records: Array<{
      sender: string;
      recipient_name: string;
      recipient_id: string;
      medium: string;
      timestamp: string;
      message_content: string;
    }> = [];

    const stub_ai_client = {
      identifyNonReportingEmployees: jest
        .fn()
        .mockResolvedValue({
          non_reporting_list: confirmation_email_content.non_reporting_employees,
          identification_confidence: 0.99,
        }),

      judgePromptionTarget: jest.fn().mockResolvedValue({
        promotion_targets: non_reporting_employee_ids.map((emp_id) => ({
          employee_id: emp_id,
          promotion_reason: 'no_report_before_deadline',
          priority: 1,
        })),
        judgment_confidence: 0.98,
      }),

      generatePromotionMessage: jest
        .fn()
        .mockResolvedValue({
          email_subject: 'Reminder: Daily Report Missing',
          email_body:
            'Please submit your daily report (Yesterday\'s achievements, Today\'s plan, Current issues) by 09:00 AM.',
          chat_message:
            'Reminder: Please submit your daily report including yesterday\'s work, today\'s plan, and any issues.',
        }),
    };

    const stub_mail_system = {
      sendEmail: jest.fn().mockImplementation(async (recipient_id, recipient_name, subject, body) => {
        const send_timestamp = new Date().toISOString();
        send_history_records.push({
          sender: 'System',
          recipient_name,
          recipient_id,
          medium: 'email',
          timestamp: send_timestamp,
          message_content: body,
        });
        return { sent: true, message_id: `msg_${recipient_id}_${Date.now()}` };
      }),
    };

    const stub_chat_system = {
      sendMessage: jest.fn().mockImplementation(async (recipient_id, recipient_name, message) => {
        const send_timestamp = new Date().toISOString();
        send_history_records.push({
          sender: 'System',
          recipient_name,
          recipient_id,
          medium: 'chat',
          timestamp: send_timestamp,
          message_content: message,
        });
        return { sent: true, message_id: `chat_${recipient_id}_${Date.now()}` };
      }),
    };

    const agent_result = await runTx3Imp1Agent(
      {
        confirmation_email: confirmation_email_content,
        escalation_rule: escalation_rule,
        execution_timestamp: test_start_time.toISOString(),
      },
      {
        ai_client: stub_ai_client,
        mail_system: stub_mail_system,
        chat_system: stub_chat_system,
      }
    );

    expect(agent_result.success).toBe(true);
    expect(agent_result.action_status).toEqual('promotion_messages_sent');
    expect(agent_result.non_reporting_count).toBe(4);
    expect(agent_result.promotion_target_count).toBe(4);
    expect(agent_result.escalation_triggered).toBe(false);

    expect(stub_ai_client.identifyNonReportingEmployees).toHaveBeenCalledTimes(1);
    expect(stub_ai_client.judgePromptionTarget).toHaveBeenCalledTimes(1);
    expect(stub_ai_client.generatePromotionMessage).toHaveBeenCalledTimes(1);

    expect(stub_mail_system.sendEmail).toHaveBeenCalledTimes(4);
    expect(stub_chat_system.sendMessage).toHaveBeenCalledTimes(4);

    const email_send_records = send_history_records.filter((rec) => rec.medium === 'email');
    const chat_send_records = send_history_records.filter((rec) => rec.medium === 'chat');

    expect(email_send_records).toHaveLength(4);
    expect(chat_send_records).toHaveLength(4);

    for (const email_record of email_send_records) {
      expect(email_record.sender).toBe('System');
      expect(non_reporting_employee_ids).toContain(email_record.recipient_id);
      expect(['Alice Johnson', 'Bob Smith', 'Carol Williams', 'David Brown']).toContain(
        email_record.recipient_name
      );
      expect(email_record.message_content).toContain('daily report');
      expect(email_record.message_content).toContain('Yesterday');
      expect(email_record.message_content).toContain('Today');
    }

    for (const chat_record of chat_send_records) {
      expect(chat_record.sender).toBe('System');
      expect(non_reporting_employee_ids).toContain(chat_record.recipient_id);
      expect(['Alice Johnson', 'Bob Smith', 'Carol Williams', 'David Brown']).toContain(
        chat_record.recipient_name
      );
      expect(chat_record.message_content).toContain('daily report');
    }

    const unique_email_recipients = new Set(
      email_send_records.map((rec) => rec.recipient_id)
    );
    const unique_chat_recipients = new Set(
      chat_send_records.map((rec) => rec.recipient_id)
    );

    expect(unique_email_recipients.size).toBe(4);
    expect(unique_chat_recipients.size).toBe(4);

    const execution_start = new Date(test_start_time);
    const execution_end = new Date();
    const execution_duration_ms = execution_end.getTime() - execution_start.getTime();

    expect(execution_duration_ms).toBeLessThan(10000);

    expect(agent_result.promotion_send_results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          employee_id: 'E001',
          email_sent: true,
          chat_sent: true,
        }),
        expect.objectContaining({
          employee_id: 'E002',
          email_sent: true,
          chat_sent: true,
        }),
        expect.objectContaining({
          employee_id: 'E003',
          email_sent: true,
          chat_sent: true,
        }),
        expect.objectContaining({
          employee_id: 'E004',
          email_sent: true,
          chat_sent: true,
        }),
      ])
    );

    expect(agent_result.errors).toEqual([]);
    expect(agent_result.escalation_conditions_triggered).toEqual([]);
  });
});