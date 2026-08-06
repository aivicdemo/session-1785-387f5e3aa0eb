import { describe, test, expect, beforeEach } from '@jest/globals';
import { sendConfirmationEmailsToBothRecipients } from '../../src/logic/it-1-br-1-1-1';

describe('報告送信時に送信者本人と部長宛に確認メールを自動配信する機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-459
  test('部長ユーザーIDが0のとき、エラーになる', () => {
    const invalid_manager_id = 0;
    const reporter_user_id = 5;
    const report_content = {
      yesterday_achievement: 'Yesterday tasks completed',
      todays_plan: 'Today plan details',
      issues_held: 'Current issues'
    };
    const send_timestamp = new Date('2024-01-15T09:00:00Z');

    const invalid_input = {
      manager_user_id: invalid_manager_id,
      reporter_user_id: reporter_user_id,
      report_content: report_content,
      send_timestamp: send_timestamp
    };

    expect(() =>
      sendConfirmationEmailsToBothRecipients(invalid_input)
    ).toThrow(/部長ユーザーID/);
  });
});