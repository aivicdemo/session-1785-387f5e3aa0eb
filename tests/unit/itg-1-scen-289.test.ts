import { type Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/orchestrator";
import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';

import { validateSenderEmailFormat } from '../../src/logic/it-1-br-1-1-1';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn(),
  }),
}));

// Mock logger
jest.mock('../../src/lib/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

const logger = require('../../src/lib/logger');
const nodemailer = require('nodemailer');

describe('確認メール配信機能 - 送信者メールアドレスフォーマット検証', () => {
  // SCEN-289
  test('送信者のメールアドレスが不正な形式のとき、メール配信処理が中断される', async () => {
    // Setup: テスト用の偽AIクライアント
    const mockAiClient: Partial<Tx2Imp1AiClient> = {
      identifyMissingReporters: jest.fn().mockResolvedValue({
        missingReporters: ['EMP001'],
        delayedReporters: [],
      }),
      generateNotificationContent: jest.fn().mockResolvedValue({
        subject: 'Test Notification',
        body: 'Missing reporters detected',
      }),
    };

    // Setup: 不正なメールアドレス形式を設定
    const invalidEmailFormats = [
      'user@',
      '@example.com',
      'user name@example.com',
      'user@example',
      'user@@example.com',
      'user@.example.com',
    ];

    // Test: 各不正形式に対して検証を実行
    for (const invalidEmail of invalidEmailFormats) {
      // Reset mocks before each iteration
      jest.clearAllMocks();

      // Mock の setups
      const mockTransport = {
        sendMail: jest.fn(),
      };
      (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransport);

      // Prepare test context
      const reporterContext = {
        senderEmail: invalidEmail,
        senderName: 'Test Engineer',
        senderDepartment: 'Development',
        reportContent: {
          yesterday: 'Completed feature X',
          today: 'Start feature Y',
          issues: 'No issues',
        },
        managerEmail: 'manager@example.com',
        managerName: 'Test Manager',
        reportDate: new Date('2024-01-15T08:00:00Z'),
      };

      // Execute: Call validateSenderEmailFormat to verify validation
      const validationResult = validateSenderEmailFormat(invalidEmail);

      // Assert: Validation should fail
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.error).toMatch(/email|format|invalid/i);

      // Execute: Call runTx2Imp1Agent with invalid sender email
      const agentResult = await runTx2Imp1Agent(
        reporterContext as any,
        mockAiClient as any,
      );

      // Assert: Agent should return error status
      expect(agentResult.status).toMatch(/FAILED|ABORTED|ERROR/i);

      // Assert: Logger should record specific error message
      expect(logger.error).toHaveBeenCalled();
      const errorLogCall = (logger.error as jest.Mock).mock.calls.find(
        (call) => call[0]?.includes?.('Invalid sender email format') ||
                   call[0]?.includes?.('email'),
      );
      expect(errorLogCall).toBeDefined();

      // Assert: Transaction status should be FAILED or ABORTED
      expect(agentResult.transactionStatus).toMatch(/FAILED|ABORTED/);

      // Assert: Email transport sendMail should NOT be called
      expect(mockTransport.sendMail).not.toHaveBeenCalled();

      // Assert: No email should be sent to manager
      expect(mockTransport.sendMail).toHaveBeenCalledTimes(0);
    }
  });
});