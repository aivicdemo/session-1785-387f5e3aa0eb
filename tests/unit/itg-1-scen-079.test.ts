import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { sendConfirmationEmailOnReportSubmit } from '../../src/logic/it-2';

const fetchMock = require('jest-fetch-mock');

describe('送信時の自動確認メール通知', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    fetchMock.enableMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-079
  it('確認メール自動配信機能 - 送信者へのメール送信が失敗したときエラーとなる', async () => {
    const report_id = '00001';
    const submitter_id = 'ENG-001';
    const submitter_email = 'eng001@example.com';
    const department_id = 'DEV-001';
    const manager_id = 'MGR-001';
    const manager_email = 'manager001@example.com';
    const yesterday_results = '昨日のタスク完了';
    const today_plans = '本日の予定案';
    const current_issues = '現在の課題内容';
    const submitted_at = new Date('2024-01-15T08:30:00Z').toISOString();

    const report_input = {
      report_id,
      submitter_id,
      submitter_email,
      department_id,
      manager_id,
      manager_email,
      yesterday_results,
      today_plans,
      current_issues,
      submitted_at,
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: false,
        error: 'SMTPエラー',
      }),
      { status: 500 }
    );

    const result = await sendConfirmationEmailOnReportSubmit(report_input);

    expect(result).toEqual({
      success: false,
      error_code: '確認メール配信エラー',
      error_message: '管理者への確認メール送信に失敗しました',
      report_saved: true,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0];
    expect(call[0]).toMatch(/email|mail/i);
    expect(call[1].method).toBe('POST');
  });
});