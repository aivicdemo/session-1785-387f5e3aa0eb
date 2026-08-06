import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { sendConfirmationEmailsOnReportSubmission } from '../../src/logic/it-1-br-1-1-1';

describe('報告送信時の確認メール自動配信機能 - 部長ID空文字列エラーハンドリング', () => {
  let mockEmailService: jest.Mock;

  beforeEach(() => {
    mockEmailService = jest.fn();
    jest.clearAllMocks();
  });

  // SCEN-420
  test('部長IDが空文字列のときエラーになり、メール送信サービスが呼び出されない', () => {
    const report_id = 'RPT-20240115-001';
    const submitter_user_id = 'ENG-0001';
    const submitter_email = 'engineer@example.com';
    const department_head_user_id = '';
    const report_content = {
      yesterday_achievement: '昨日はタスクAを完了しました',
      todays_plan: '本日はタスクBに着手します',
      current_issues: 'タスクCで依存関係が発生しています',
    };
    const submitted_at = new Date('2024-01-15T08:30:00Z');

    expect(() =>
      sendConfirmationEmailsOnReportSubmission(
        {
          report_id,
          submitter_user_id,
          submitter_email,
          department_head_user_id,
          report_content,
          submitted_at,
        },
        mockEmailService
      )
    ).toThrow(/部長ID/);

    expect(mockEmailService).not.toHaveBeenCalled();
  });
});