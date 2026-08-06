import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fetchMock from 'jest-fetch-mock';
import { sendConfirmationEmailsToReporterAndManager } from '../../src/logic/it-1-br-1-1-1';

fetchMock.enableMocks();

describe('朝会報告管理システム - 報告送信時の確認メール自動配信機能', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-208: [error] 朝会開始前の日報送信状況確認・部長通知機能 - 部員がシステムにログイン不可の状態のとき、送信状況判定がエラーになる
  test('部員ユーザーがログイン認証エラー状態のとき、送信状況判定ロジックがエラーハンドリングを実行し、部長への通知メールを送信しない', async () => {
    const report_id = 'RPT-20240115-001';
    const reporter_user_id = 'USR-ENG-0001';
    const manager_user_id = 'USR-MGRT-0001';
    const report_content = {
      yesterday_achievement: '機能A の単体テストを完了',
      today_plan: '機能B の実装開始',
      current_issues: 'DB スキーマ設計で承認待ち',
    };
    const sent_at = new Date('2024-01-15T08:30:00Z');
    const morning_meeting_start_time = new Date('2024-01-15T09:00:00Z');

    const input_payload = {
      report_id,
      reporter_user_id,
      manager_user_id,
      report_content,
      sent_at,
      morning_meeting_start_time,
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        error_code: 401,
        error_message: 'Unauthorized',
        details: 'ユーザー認証失敗による送信状況判定中止',
      }),
      { status: 401 }
    );

    const result = await sendConfirmationEmailsToReporterAndManager(input_payload);

    expect(result).toEqual({
      success: false,
      error_code: 401,
      error_message: 'ユーザー認証失敗による送信状況判定中止',
      notification_sent_to_manager: false,
      logs: expect.arrayContaining([
        expect.stringMatching(/ログイン不可ユーザー/),
        expect.stringMatching(/判定対象外/),
      ]),
    });

    expect(result.notification_sent_to_manager).toBe(false);
    expect(result.success).toBe(false);
    expect(result.error_code).toBe(401);
  });
});