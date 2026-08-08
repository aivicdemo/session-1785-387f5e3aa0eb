import { type Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/orchestrator";
import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';

describe('確認メール配信機能 - 送信者ユーザーID検証', () => {
  // SCEN-300
  test('送信者ユーザーIDがnullのとき、メール配信処理が中断される', async () => {
    const mockAiClient: Tx2Imp1AiClient = {
      analyzeReportStatus: jest.fn(),
      generateNotificationMessage: jest.fn(),
    };

    const mockLogger = {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };

    const mockMailService = {
      sendMail: jest.fn(),
    };

    const testInput = {
      senderUserId: null as any,
      recipientEmail: 'manager@example.com',
      reportContent: {
        yesterday: 'Completed task A',
        today: 'Task B scheduled',
        issues: 'No issues',
      },
      sentAt: new Date('2024-01-15T08:30:00Z'),
    };

    const result = await runTx2Imp1Agent(
      testInput,
      mockAiClient,
      mockLogger,
      mockMailService
    );

    expect(mockAiClient.analyzeReportStatus).not.toHaveBeenCalled();
    expect(mockAiClient.generateNotificationMessage).not.toHaveBeenCalled();
    expect(mockMailService.sendMail).not.toHaveBeenCalled();

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringMatching(/senderUserId.*null/)
    );

    expect(result).toEqual({
      status: 'ABORTED',
      reason: 'INVALID_SENDER',
      timestamp: expect.any(Date),
    });
  });
});