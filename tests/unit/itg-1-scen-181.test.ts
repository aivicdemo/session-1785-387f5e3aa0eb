import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { submitReportForm } from '../../src/logic/it-1';

// Mock email service
const mockSendEmail = jest.fn();

jest.mock('../../src/logic/it-1', () => ({
  sendEmail: mockSendEmail,
}));

describe('朝会報告送信フォーム', () => {
  beforeEach(() => {
    mockSendEmail.mockClear();
  });

  // SCEN-181
  test('項目2の文字数が最大許容値直下(255文字)で送信が続行される', () => {
    const yesterday_accomplishment = 'テスト用テキスト';
    const today_plan = 'a'.repeat(255);
    const current_issue = 'テスト用課題';
    const report_user_id = 'user_001';
    const report_date = '2024-01-15';
    const admin_email = 'admin@example.com';
    const user_email = 'user@example.com';

    const result = submitReportForm({
      yesterday_accomplishment,
      today_plan,
      current_issue,
      report_user_id,
      report_date,
      admin_email,
      user_email,
    });

    expect(result.success).toBe(true);
    expect(result.validation_errors).toEqual([]);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: admin_email,
        subject: expect.stringContaining('朝会報告'),
        body: expect.stringContaining(today_plan),
      })
    );
    expect(mockSendEmail.mock.calls[0][0].body).toContain(today_plan);
    const body_text = mockSendEmail.mock.calls[0][0].body;
    const today_plan_match = body_text.match(new RegExp('a'.repeat(255)));
    expect(today_plan_match).not.toBeNull();
  });
});