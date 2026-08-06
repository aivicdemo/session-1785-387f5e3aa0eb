import { describe, test, expect, beforeEach } from '@jest/globals';
import { sendConfirmationEmailWithValidation } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  let mailServiceStub: { send: jest.Mock };

  beforeEach(() => {
    mailServiceStub = {
      send: jest.fn().mockResolvedValue({ success: true }),
    };
  });

  // SCEN-131
  test('部長IDが空文字列のとき、メール送信処理が実行されない', async () => {
    const report_submission_request = {
      user_id: 'eng-001',
      user_name: 'エンジニア太郎',
      department_id: 'dev-001',
      yesterday_result: '昨日の実績',
      today_plan: '本日の予定',
      issues: '抱えている課題',
      manager_user_id: '',
      submitted_at: new Date('2024-01-15T08:30:00Z'),
    };

    await sendConfirmationEmailWithValidation(
      report_submission_request,
      mailServiceStub.send
    );

    expect(mailServiceStub.send).not.toHaveBeenCalled();
  });
});