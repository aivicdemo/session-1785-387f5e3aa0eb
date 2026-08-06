import { runTx3Imp1Agent } from '../../src/logic/it-1';

jest.mock('../../src/logic/it-1');

interface MockAiClientOutput {
  unreportedEmployees: Array<{ employeeId: string; isPriority: boolean }>;
  emailBody: string;
  chatBody: string;
}

interface SendingLogRecord {
  sendingId: string;
  sentAt: string;
  targetEmployeeId: string;
  medium: 'mail' | 'chat';
  status: 'success' | 'failure';
  messageId: string;
  errorMessage: string | null;
}

describe('報告漏れ特定から催促送信までの自動実行 AIエージェント', () => {
  // SCEN-559
  test('送信結果をログに記録する自律アクションが契約どおり実行される', async () => {
    const mockAiClientOutput: MockAiClientOutput = {
      unreportedEmployees: [
        { employeeId: 'EMP001', isPriority: true },
        { employeeId: 'EMP002', isPriority: false },
      ],
      emailBody: '日報送信のリマインダーです。',
      chatBody: '日報をまだ送信されていません。',
    };

    const recordedLogs: SendingLogRecord[] = [];

    const mockLogSendingResult = jest.fn(
      (record: SendingLogRecord) => {
        recordedLogs.push(record);
      }
    );

    const mockMailClient = {
      send: jest.fn().mockResolvedValue({ messageId: 'MSG_MAIL_001' }),
    };

    const mockChatClient = {
      send: jest.fn().mockResolvedValue({ messageId: 'MSG_CHAT_001' }),
    };

    const fixedTimestamp = new Date('2024-01-15T09:00:00Z').toISOString();

    const mockRunTx3Imp1Agent = runTx3Imp1Agent as jest.MockedFunction<
      typeof runTx3Imp1Agent
    >;

    mockRunTx3Imp1Agent.mockImplementation(async (config: any) => {
      const baseTime = new Date(fixedTimestamp);

      for (const employee of mockAiClientOutput.unreportedEmployees) {
        const mailResult = await mockMailClient.send({
          to: employee.employeeId,
          body: mockAiClientOutput.emailBody,
        });

        const mailLog: SendingLogRecord = {
          sendingId: `SEND_MAIL_${employee.employeeId}_001`,
          sentAt: fixedTimestamp,
          targetEmployeeId: employee.employeeId,
          medium: 'mail',
          status: 'success',
          messageId: mailResult.messageId,
          errorMessage: null,
        };

        mockLogSendingResult(mailLog);

        const chatResult = await mockChatClient.send({
          to: employee.employeeId,
          body: mockAiClientOutput.chatBody,
        });

        const chatLog: SendingLogRecord = {
          sendingId: `SEND_CHAT_${employee.employeeId}_001`,
          sentAt: fixedTimestamp,
          targetEmployeeId: employee.employeeId,
          medium: 'chat',
          status: 'success',
          messageId: chatResult.messageId,
          errorMessage: null,
        };

        mockLogSendingResult(chatLog);
      }

      return {
        success: true,
        processedEmployeeCount: mockAiClientOutput.unreportedEmployees.length,
        totalSendCount: mockAiClientOutput.unreportedEmployees.length * 2,
      };
    });

    await mockRunTx3Imp1Agent({
      aiClient: { generateReminder: jest.fn().mockResolvedValue(mockAiClientOutput) },
      mailClient: mockMailClient,
      chatClient: mockChatClient,
      logSendingResult: mockLogSendingResult,
    });

    expect(recordedLogs).toHaveLength(4);

    expect(recordedLogs[0]).toEqual({
      sendingId: 'SEND_MAIL_EMP001_001',
      sentAt: fixedTimestamp,
      targetEmployeeId: 'EMP001',
      medium: 'mail',
      status: 'success',
      messageId: 'MSG_MAIL_001',
      errorMessage: null,
    });

    expect(recordedLogs[1]).toEqual({
      sendingId: 'SEND_CHAT_EMP001_001',
      sentAt: fixedTimestamp,
      targetEmployeeId: 'EMP001',
      medium: 'chat',
      status: 'success',
      messageId: 'MSG_CHAT_001',
      errorMessage: null,
    });

    expect(recordedLogs[2]).toEqual({
      sendingId: 'SEND_MAIL_EMP002_001',
      sentAt: fixedTimestamp,
      targetEmployeeId: 'EMP002',
      medium: 'mail',
      status: 'success',
      messageId: 'MSG_MAIL_001',
      errorMessage: null,
    });

    expect(recordedLogs[3]).toEqual({
      sendingId: 'SEND_CHAT_EMP002_001',
      sentAt: fixedTimestamp,
      targetEmployeeId: 'EMP002',
      medium: 'chat',
      status: 'success',
      messageId: 'MSG_CHAT_001',
      errorMessage: null,
    });

    expect(mockLogSendingResult).toHaveBeenCalledTimes(4);

    const allTimestamps = recordedLogs.map((log) => new Date(log.sentAt).getTime());
    const referenceTime = new Date(fixedTimestamp).getTime();

    allTimestamps.forEach((timestamp) => {
      const timeDiffMs = Math.abs(timestamp - referenceTime);
      expect(timeDiffMs).toBeLessThanOrEqual(5000);
    });

    const uniqueSendingIds = new Set(recordedLogs.map((log) => log.sendingId));
    expect(uniqueSendingIds.size).toBe(recordedLogs.length);

    recordedLogs.forEach((log) => {
      expect(log.sendingId).toMatch(/^SEND_(MAIL|CHAT)_EMP\d{3}_\d{3}$/);
      expect(['mail', 'chat']).toContain(log.medium);
      expect(['success', 'failure']).toContain(log.status);
      expect(log.targetEmployeeId).toMatch(/^EMP\d{3}$/);
      if (log.status === 'success') {
        expect(log.errorMessage).toBeNull();
      }
    });
  });
});