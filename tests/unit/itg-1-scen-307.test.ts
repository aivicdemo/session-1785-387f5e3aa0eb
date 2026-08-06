import { runTx2Imp1Agent } from '../../src/logic/it-1-br-1-1-1';

describe('確認メール配信機能 - 未送信部員情報がnullの場合の処理中断', () => {
  // SCEN-307
  test('未送信部員情報の配列がnullのとき、メール配信処理が中断される', async () => {
    // Arrange: Tx2Imp1AiClientのスタブを注入
    const mockAiClient = {
      identifyNonSubmitters: jest.fn().mockResolvedValue(null),
      identifyDelayedSubmitters: jest.fn().mockResolvedValue([]),
      generateNotificationEmail: jest.fn(),
    };

    // メール送信関数のスパイ
    const mockMailer = {
      sendMail: jest.fn(),
    };
    jest.mock('nodemailer', () => ({
      createTransport: jest.fn(() => mockMailer),
    }));

    // 監査ログ記録のスパイ
    const auditLog: Array<{ event: string; timestamp: string }> = [];
    const mockAuditLogger = {
      log: jest.fn((event: string) => {
        auditLog.push({
          event,
          timestamp: new Date('2024-01-15T08:00:00Z').toISOString(),
        });
      }),
    };

    // Act: runTx2Imp1Agent関数を実行
    const result = await runTx2Imp1Agent({
      aiClient: mockAiClient,
      auditLogger: mockAuditLogger,
      mailer: mockMailer,
      checkpointTime: new Date('2024-01-15T08:00:00Z'),
      deadlineTime: new Date('2024-01-15T09:00:00Z'),
      departmentHeadEmail: 'head@example.com',
    });

    // Assert: メール送信がスキップされたことを確認
    expect(mockMailer.sendMail).not.toHaveBeenCalled();

    // Assert: 関数の戻り値がnull値検出によるスキップステータスであることを確認
    expect(result).toEqual({
      status: 'skipped_null_detection',
      message: '未送信部員情報がnull - メール配信中断',
      nonSubmittersCount: null,
      delayedSubmittersCount: 0,
      emailsSent: 0,
    });

    // Assert: 監査ログに処理中断イベントが記録されたことを確認
    expect(auditLog).toContainEqual(
      expect.objectContaining({
        event: '未送信部員情報がnull - メール配信中断',
      })
    );
    expect(mockAuditLogger.log).toHaveBeenCalledWith(
      '未送信部員情報がnull - メール配信中断'
    );

    // Assert: スタブされたAiClientのメソッドが呼び出されたことを確認
    expect(mockAiClient.identifyNonSubmitters).toHaveBeenCalled();

    // Assert: メール生成関数は呼び出されないことを確認
    expect(mockAiClient.generateNotificationEmail).not.toHaveBeenCalled();
  });
});