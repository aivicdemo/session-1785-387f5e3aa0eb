import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import * as logic from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  let mockMailService: { sendMail: jest.Mock };

  beforeEach(() => {
    mockMailService = {
      sendMail: jest.fn().mockResolvedValue({ success: true }),
    };
    jest.clearAllMocks();
  });

  // SCEN-124
  test('[error] 確認メール自動配信機能 - 抱えている課題がnullのとき、メール送信処理が実行されない', async () => {
    const reportData = {
      userId: 'user_001',
      reportDate: '2024-01-15',
      yesterdayResult: 'リリース前テスト完了',
      todayPlan: 'デプロイ実施予定',
      issue: null,
    };

    const result = await logic.sendReportWithEmailNotification(
      reportData,
      mockMailService,
    );

    expect(mockMailService.sendMail).not.toHaveBeenCalled();
    expect(mockMailService.sendMail).toHaveBeenCalledTimes(0);
    expect(result).toEqual({
      reportId: expect.any(String),
      sent: false,
      reason: '抱えている課題',
    });
  });
});