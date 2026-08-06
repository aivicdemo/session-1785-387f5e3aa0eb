import { describe, test, expect, beforeEach } from '@jest/globals';
import { sendConfirmationEmailToManager } from '../../src/logic/it-2';

describe('確認メール自動配信機能', () => {
  // SCEN-071
  test('部長のメールアドレスが空文字のときエラーとなる', () => {
    const report_content = {
      yesterday_achievement: '前日のタスクを完了しました',
      today_plan: '本日は新しいタスクに取り組みます',
      current_issue: '特に大きな課題はありません'
    };

    const manager_email = '';

    expect(() =>
      sendConfirmationEmailToManager(report_content, manager_email)
    ).toThrow(/部長のメールアドレス/);
  });
});