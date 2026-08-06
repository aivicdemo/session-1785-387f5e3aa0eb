import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendConfirmationEmailAndLogFailure } from '../../src/logic/it-2';

const fetchMock = require('jest-fetch-mock');

describe('確認メール自動配信機能 - メール送信ログ保存失敗時のエラー処理', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-081
  test('メール送信ログレコードの保存に失敗したときエラーとなる', async () => {
    const user_id = 'ENG-001';
    const user_name = '田中太郎';
    const user_email = 'tanaka.taro@example.com';
    const manager_email = 'manager@example.com';
    const yesterday_work = '昨日は画面設計ドキュメントを完成させた';
    const today_plan = '本日は実装フェーズに進める予定です';
    const current_issue = 'データベース接続のパフォーマンス課題が発生中';
    const report_date = '2024-01-15';
    const sent_at = '2024-01-15T08:30:00Z';

    // メール送信 API は成功
    fetchMock.mockResponseOnce(
      JSON.stringify({ message_id: 'msg-12345', status: 'sent' }),
      { status: 200 }
    );

    // メール送信ログ保存 API はエラーを返す
    fetchMock.mockResponseOnce(
      JSON.stringify({ error: 'Database connection failed' }),
      { status: 500 }
    );

    const input = {
      user_id,
      user_name,
      user_email,
      manager_email,
      yesterday_work,
      today_plan,
      current_issue,
      report_date,
      sent_at,
    };

    await expect(() => sendConfirmationEmailAndLogFailure(input)).rejects.toThrow(
      /ログ保存/
    );
  });
});