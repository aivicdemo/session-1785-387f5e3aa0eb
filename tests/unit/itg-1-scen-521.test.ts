import { describe, test, expect, beforeEach } from '@jest/globals';
import { sendPromptNotificationEmailsForNonReporters } from '../../src/logic/it-1-br-1-1-1';

// Mock fetch
const fetchMock = require('jest-fetch-mock');
fetchMock.enableMocks();

describe('未報告部員催促通知機能', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-521: [edge] 未報告部員催促通知機能 - 未報告者が10名中ちょうど1名の場合、その1名のみが催促対象に含まれる
  test('should identify exactly 1 non-reporter out of 10 members and send notification email only to that member', async () => {
    // 部員10名のうち9名の朝会報告送信済みユーザー ID
    const reported_user_ids = [
      'user_001',
      'user_002',
      'user_003',
      'user_004',
      'user_005',
      'user_006',
      'user_007',
      'user_008',
      'user_009',
    ];

    // 部員10名全体のユーザー ID
    const all_user_ids = [
      ...reported_user_ids,
      'user_010', // 未報告者
    ];

    // 未報告者の情報
    const non_reporter_user_id = 'user_010';
    const non_reporter_email = 'user_010@example.com';

    // 外部メールサービスのモック
    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        message_id: 'msg_123456',
      }),
      { status: 200 }
    );

    // 催促通知メール送信関数を実行
    const result = await sendPromptNotificationEmailsForNonReporters({
      all_member_user_ids: all_user_ids,
      reported_user_ids: reported_user_ids,
      non_reporter_email_address: non_reporter_email,
      notification_deadline_time: '2024-01-15T09:00:00Z',
      morning_meeting_start_time: '2024-01-15T09:30:00Z',
    });

    // 期待値: 催促対象者リストに未報告の1名のみが含まれる
    expect(result.prompt_target_user_count).toBe(1);
    expect(result.prompt_target_user_ids).toEqual([non_reporter_user_id]);
    expect(result.prompt_target_user_ids).not.toContain('user_001');
    expect(result.prompt_target_user_ids).not.toContain('user_002');
    expect(result.prompt_target_user_ids).not.toContain('user_003');
    expect(result.prompt_target_user_ids).not.toContain('user_004');
    expect(result.prompt_target_user_ids).not.toContain('user_005');
    expect(result.prompt_target_user_ids).not.toContain('user_006');
    expect(result.prompt_target_user_ids).not.toContain('user_007');
    expect(result.prompt_target_user_ids).not.toContain('user_008');
    expect(result.prompt_target_user_ids).not.toContain('user_009');

    // 外部メールサービスへのメール送信履歴確認: 未報告者1名宛てのメール送信が1回のみ
    expect(fetchMock.mock.calls.length).toBe(1);
    const email_send_request = fetchMock.mock.calls[0][1];
    expect(email_send_request.method).toBe('POST');
    const email_body = JSON.parse(email_send_request.body);
    expect(email_body.recipient_email).toBe(non_reporter_email);
    expect(email_body.recipient_user_id).toBe(non_reporter_user_id);

    // 送信結果の成功確認
    expect(result.notification_email_sent).toBe(true);
    expect(result.notification_email_send_count).toBe(1);
  });
});