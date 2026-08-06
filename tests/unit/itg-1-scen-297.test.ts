import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';
import type { Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/orchestrator';

// Mock modules
jest.mock('../../src/logic/it-1-br-1-1-1');
jest.mock('../../src/services/mail-service');
jest.mock('../../src/services/logger');

import * as logicModule from '../../src/logic/it-1-br-1-1-1';
import * as mailService from '../../src/services/mail-service';
import * as logger from '../../src/services/logger';

describe('確認メール配信機能 - 報告内容が空文字のとき', () => {
  // SCEN-297
  test('報告内容3項目目が空文字のとき、メール配信処理が中断される', async () => {
    // Arrange
    const incomplete_report_data = {
      user_id: 'eng_001',
      report_date: '2024-01-15',
      yesterday_achievement: 'Completed API integration for user authentication',
      today_plan: 'Start database optimization task',
      issue_held: '', // 3rd item is empty string
      submitted_at: '2024-01-15T07:30:00Z',
    };

    const manager_email = 'manager@company.com';
    const engineer_email = 'engineer001@company.com';

    // Mock AI client
    const mock_ai_client: Tx2Imp1AiClient = {
      analyzeReportStatus: jest.fn().mockResolvedValue({
        all_submitted: false,
        missing_reporters: ['eng_001'],
        delayed_reporters: [],
      }),
      generateNotificationContent: jest.fn().mockResolvedValue({
        subject: 'Daily Report Status',
        body: 'Report collection complete',
      }),
    };

    // Mock mail service
    (mailService.sendConfirmationEmail as jest.Mock).mockResolvedValue({
      status: 'sent',
      message_id: 'msg_001',
    });

    // Mock logger
    (logger.warn as jest.Mock).mockImplementation(() => {});
    (logger.info as jest.Mock).mockImplementation(() => {});

    // Mock logic module to validate report completeness
    (logicModule.validateReportCompleteness as jest.Mock).mockReturnValue({
      is_complete: false,
      missing_fields: ['issue_held'],
      validation_message: 'Report content is incomplete',
    });

    // Mock logic module for email filtering
    (logicModule.filterCompleteReports as jest.Mock).mockReturnValue([]);

    // Act
    const result = await runTx2Imp1Agent(
      {
        reports: [incomplete_report_data],
        manager_email: manager_email,
        scheduled_time: '2024-01-15T09:00:00Z',
      },
      mock_ai_client
    );

    // Assert
    // Verify that sendConfirmationEmail was NOT called for this incomplete report
    expect(mailService.sendConfirmationEmail).not.toHaveBeenCalledWith(
      expect.objectContaining({
        report_data: incomplete_report_data,
      })
    );

    // Verify that logger.warn was called with appropriate message
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('報告内容が不完全のため配信処理をスキップした')
    );

    // Verify that filterCompleteReports was called and returned empty array
    expect(logicModule.filterCompleteReports).toHaveBeenCalled();
    const filtered_result = (logicModule.filterCompleteReports as jest.Mock).mock.results[0].value;
    expect(filtered_result).toEqual([]);

    // Verify that the notification does not include the incomplete report
    expect(result.notification_sent).toBe(true);
    expect(result.included_reports).not.toContainEqual(
      expect.objectContaining({
        user_id: 'eng_001',
      })
    );

    // Verify that mail send count for this report is 0
    const mail_calls = (mailService.sendConfirmationEmail as jest.Mock).mock.calls;
    const calls_for_this_report = mail_calls.filter(
      (call_args: any) =>
        call_args[0]?.report_data?.user_id === 'eng_001'
    );
    expect(calls_for_this_report).toHaveLength(0);

    // Verify validation was performed
    expect(logicModule.validateReportCompleteness).toHaveBeenCalledWith(
      expect.objectContaining({
        yesterday_achievement: 'Completed API integration for user authentication',
        today_plan: 'Start database optimization task',
        issue_held: '',
      })
    );

    // Verify that the system response indicates processing was done but report was filtered
    expect(result).toEqual(
      expect.objectContaining({
        total_processed: 1,
        included_reports: [],
        filtered_out_count: 1,
        mail_send_log: expect.objectContaining({
          manager_notification_sent: true,
          incomplete_reports_count: 1,
        }),
      })
    );
  });
});