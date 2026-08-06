import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { checkAllReportsComplete } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能 - 全員報告完了判定', () => {
  let mockLogger: any;
  let mockDatabaseClient: any;

  beforeEach(() => {
    mockLogger = {
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };

    mockDatabaseClient = {
      getUnreportedMembers: jest.fn(),
      getReportedCount: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-363
  test('期待報告人数と実報告数が不一致で、未報告者の特定に失敗した場合、エラーメッセージが返される', async () => {
    const expected_report_count = 10;
    const actual_report_count = 8;
    const expected_unreported_count = 2;

    mockDatabaseClient.getReportedCount.mockResolvedValueOnce(actual_report_count);
    mockDatabaseClient.getUnreportedMembers.mockRejectedValueOnce(
      new Error('データベース接続エラー'),
    );

    const result = await checkAllReportsComplete({
      expectedReportCount: expected_report_count,
      databaseClient: mockDatabaseClient,
      logger: mockLogger,
      shouldSendConfirmationEmail: true,
    });

    expect(result.isAllReported).toBe(false);
    expect(result.reportedCount).toBe(actual_report_count);
    expect(result.unreportedCount).toBe(expected_unreported_count);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toMatch(/未報告者を特定できません/);
    expect(result.error?.details).toMatch(/未報告者リスト取得失敗/);
    expect(result.confirmationEmailSent).toBe(false);

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('未報告者リスト取得失敗'),
    );
    expect(mockDatabaseClient.getReportedCount).toHaveBeenCalled();
    expect(mockDatabaseClient.getUnreportedMembers).toHaveBeenCalled();
  });
});