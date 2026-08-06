import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendConfirmationEmailOnSubmission } from '../../src/logic/it-2';

describe('送信時の自動確認メール通知', () => {
  // SCEN-070
  test('部長のメールアドレスが null のときエラーとなる', () => {
    const report_submission_data = {
      reporter_id: 'ENG001',
      yesterday_achievement: '前日の機能実装を完了した',
      today_plan: '本日はバグ修正を行う予定',
      current_issue: 'データベース接続の遅延',
      submission_timestamp: new Date('2024-01-15T08:30:00Z'),
    };

    const manager_info = {
      manager_id: 'MGR001',
      manager_email: null,
      manager_name: 'Tanaka Taro',
    };

    expect(() => {
      sendConfirmationEmailOnSubmission(report_submission_data, manager_info);
    }).toThrow(/部長のメールアドレス/);
  });
});