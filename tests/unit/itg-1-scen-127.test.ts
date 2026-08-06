import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as sendConfirmationEmailLogic from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  let mockSendEmail: jest.Mock;
  let mockLogError: jest.Mock;
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendEmail = jest.fn();
    mockLogError = jest.fn();
    originalConsoleError = console.error;
    console.error = mockLogError;
  });

  afterEach(() => {
    console.error = originalConsoleError;
    jest.restoreAllMocks();
  });

  // SCEN-127
  it('should not send confirmation email when manager email address is empty string', async () => {
    const report_content = {
      yesterday_achievement: '昨日は機能A の実装を完了しました',
      today_plan: '本日は機能B の実装に着手します',
      current_issue: '環境構築で1時間遅延しています',
    };

    const manager_info = {
      manager_id: 'MGR001',
      manager_email: '',
      manager_name: '部長 太郎',
    };

    const employee_info = {
      employee_id: 'EMP001',
      employee_name: '社員 花子',
      employee_email: 'hanako@company.com',
    };

    const submission_timestamp = new Date('2024-01-15T08:30:00Z');

    const result = await sendConfirmationEmailLogic.sendConfirmationEmail(
      report_content,
      manager_info,
      employee_info,
      submission_timestamp,
      mockSendEmail,
      mockLogError
    );

    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockLogError).toHaveBeenCalledWith(
      expect.stringMatching(/部長のメールアドレス/)
    );
    expect(result).toEqual({
      success: false,
      reason: '部長のメールアドレスが設定されていません',
    });
  });
});