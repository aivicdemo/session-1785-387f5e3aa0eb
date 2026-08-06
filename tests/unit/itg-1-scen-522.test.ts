import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendUnreportedMemberNotification } from '../../src/logic/it-1-br-1-1-1';

describe('未報告部員催促通知機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-522
  test('未報告者が10名全員の場合、全員の名前が催促メッセージに含まれる', () => {
    const unreported_members = [
      { user_id: 'USR001', user_name: '田中太郎', department_id: 'DEP001' },
      { user_id: 'USR002', user_name: '佐藤花子', department_id: 'DEP001' },
      { user_id: 'USR003', user_name: '鈴木次郎', department_id: 'DEP001' },
      { user_id: 'USR004', user_name: '高橋美咲', department_id: 'DEP001' },
      { user_id: 'USR005', user_name: '渡辺健太', department_id: 'DEP001' },
      { user_id: 'USR006', user_name: '伊藤由美', department_id: 'DEP001' },
      { user_id: 'USR007', user_name: '中村拓也', department_id: 'DEP001' },
      { user_id: 'USR008', user_name: '小林麻衣', department_id: 'DEP001' },
      { user_id: 'USR009', user_name: '山田翔太', department_id: 'DEP001' },
      { user_id: 'USR010', user_name: '加藤優希', department_id: 'DEP001' }
    ];

    const department_head_email = 'bucho@example.com';
    const morning_meeting_start_time = new Date('2024-01-15T08:30:00Z');
    const current_time = new Date('2024-01-15T08:25:00Z');

    const result = sendUnreportedMemberNotification({
      unreported_members: unreported_members,
      department_head_email: department_head_email,
      morning_meeting_start_time: morning_meeting_start_time,
      current_time: current_time
    });

    expect(result.message_body).toContain('田中太郎');
    expect(result.message_body).toContain('佐藤花子');
    expect(result.message_body).toContain('鈴木次郎');
    expect(result.message_body).toContain('高橋美咲');
    expect(result.message_body).toContain('渡辺健太');
    expect(result.message_body).toContain('伊藤由美');
    expect(result.message_body).toContain('中村拓也');
    expect(result.message_body).toContain('小林麻衣');
    expect(result.message_body).toContain('山田翔太');
    expect(result.message_body).toContain('加藤優希');
    expect(result.recipient_email).toBe(department_head_email);
    expect(result.notification_sent).toBe(true);
  });
});