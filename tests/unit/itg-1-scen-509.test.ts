import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { sendPromptionMailForUnreportedMembers } from '../../src/logic/it-1-br-1-1-1';

// Mock for email sending
const mockEmailSender = jest.fn<(...args: any[]) => any>();

describe('未報告催促メール通知機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEmailSender.mockResolvedValue({ success: true });
  });

  // SCEN-509
  test('現在時刻が朝会開始予定時刻の15分前より前で催促メール送信対象外となる', async () => {
    // 朝会開始予定時刻を09:00に設定
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');
    
    // 現在時刻を08:45（朝会開始予定時刻の15分前）に設定
    const currentTime = new Date('2024-01-15T08:45:00Z');
    
    // 未報告の部員が1名以上存在する状態を用意
    const unreportedMembers = [
      {
        userId: 'ENG001',
        userName: 'Engineer A',
        departmentId: 'DEV',
        email: 'engineer.a@example.com'
      }
    ];
    
    // 催促メール送信処理を実行
    const result = await sendPromptionMailForUnreportedMembers(
      {
        morningMeetingStartTime,
        currentTime,
        unreportedMembers,
        emailSender: mockEmailSender
      }
    );
    
    // メール送信スタブが呼び出されず、メールが送信されない
    expect(mockEmailSender).not.toHaveBeenCalled();
    
    // システムログに『現在時刻が朝会開始予定時刻の15分前であるため催促メール送信対象外』と記録される
    expect(result).toEqual({
      sent: false,
      reason: '現在時刻が朝会開始予定時刻の15分前であるため催促メール送信対象外',
      mailCount: 0
    });
  });
});