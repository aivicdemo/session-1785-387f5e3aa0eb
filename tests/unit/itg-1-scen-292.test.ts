import { runTx2Imp1Agent } from '../../../src/agents/tx-2-imp-1/orchestrator';
import { Tx2Imp1AiClient } from '../../../src/agents/tx-2-imp-1/types';

describe('確認メール配信機能 - 部長メールアドレス不正形式時の処理中断', () => {
  // SCEN-292
  test('部長のメールアドレスが不正な形式のとき、メール配信処理が中断される', async () => {
    // Arrange
    const invalid_email_format = 'invalid-email@';
    const manager_id = 'MGR001';
    const manager_user_id = 'USER_MGR_001';
    const team_members = Array.from({ length: 10 }, (_, i) => ({
      user_id: `USER_ENG_${String(i + 1).padStart(3, '0')}`,
      name: `Engineer ${i + 1}`,
      email: `engineer${i + 1}@company.com`,
      department_id: 'DEPT_DEV',
    }));

    const submitted_reports = team_members.map((member) => ({
      user_id: member.user_id,
      submission_timestamp: new Date('2024-01-15T08:30:00Z'),
      status: 'submitted',
      yesterday_work: `Completed task for ${member.name}`,
      today_plan: `Plan task for ${member.name}`,
      issues: `Issue for ${member.name}`,
    }));

    const unsubmitted_members = [];

    const mail_send_log_entries: Array<{
      log_id: string;
      recipient_email: string;
      send_status: string;
    }> = [];

    const delivery_state = 'pending';
    const error_log_message = '部長メールアドレス不正形式により配信中断';

    // Mock AI client with email validation
    const mock_ai_client: Partial<Tx2Imp1AiClient> = {
      validateManagerEmail: async (email: string) => {
        const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email_regex.test(email)) {
          throw new Error('管理者メールアドレスの形式が不正です');
        }
        return true;
      },
      identifyUnsubmittedMembers: async (
        members: Array<{ user_id: string; name: string }>,
        submitted_ids: string[]
      ) => {
        return members.filter((m) => !submitted_ids.includes(m.user_id));
      },
      generateDeliveryReport: async (submitted: number, unsubmitted: number) => {
        return {
          total_members: submitted + unsubmitted,
          submitted_count: submitted,
          unsubmitted_count: unsubmitted,
          unsubmitted_members: unsubmitted,
        };
      },
    };

    const system_log: string[] = [];
    const db_delivery_state_ref = { state: delivery_state };

    // Act & Assert
    try {
      await runTx2Imp1Agent(
        {
          trigger_time: new Date('2024-01-15T09:00:00Z'),
          morning_meeting_start_time: new Date('2024-01-15T09:30:00Z'),
          manager_email: invalid_email_format,
          manager_id: manager_id,
          team_members: team_members,
          submitted_reports: submitted_reports,
        },
        mock_ai_client as Tx2Imp1AiClient,
        {
          logError: (message: string) => {
            system_log.push(message);
          },
          updateDeliveryState: (new_state: string) => {
            db_delivery_state_ref.state = new_state;
          },
          recordMailSendLog: (entry: {
            log_id: string;
            recipient_email: string;
            send_status: string;
          }) => {
            mail_send_log_entries.push(entry);
          },
        }
      );

      // Should not reach here - exception should be thrown
      fail('Expected error to be thrown for invalid email format');
    } catch (error) {
      // Assert: Error is caught
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toMatch(/形式が不正/);

      // Assert: Error log is recorded
      expect(system_log).toContain(error_log_message);

      // Assert: Delivery state remains "pending"
      expect(db_delivery_state_ref.state).toBe('pending');

      // Assert: No emails were sent
      expect(mail_send_log_entries).toHaveLength(0);

      // Assert: Mail send count is zero
      const sent_mail_count = mail_send_log_entries.filter(
        (entry) => entry.send_status === 'sent'
      ).length;
      expect(sent_mail_count).toBe(0);
    }
  });
});