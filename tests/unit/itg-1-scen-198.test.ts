import { describe, it, expect, beforeEach } from '@jest/globals';

describe('部長通知生成機能 - 未送信者存在時の通知内容生成', () => {
  it('SCEN-198: 未送信者が存在する場合に、未送信者情報を含む部長への通知内容が正しく生成される', () => {
    // Mock: 外部メール送信サービスをスタブで置き換え
    const mockEmailService = {
      send: jest.fn().mockResolvedValue({ success: true })
    };

    // Setup: テスト対象の部長通知生成機能を初期化
    const { generateManagerNotificationContent } = require('../../src/logic/it-1-br-1-1-1');

    // Setup: 朝会報告の送信状態データを準備
    // 全10名の部員のうち、7名は送信済み、3名（太郎、花子、次郎）は未送信
    const reportSubmissionStatus = [
      { userId: 'user001', userName: '太郎', departmentId: 'dept01', submitted: false, submittedAt: null },
      { userId: 'user002', userName: '花子', departmentId: 'dept01', submitted: false, submittedAt: null },
      { userId: 'user003', userName: '次郎', departmentId: 'dept01', submitted: false, submittedAt: null },
      { userId: 'user004', userName: '一郎', departmentId: 'dept01', submitted: true, submittedAt: '2024-01-15T08:30:00Z' },
      { userId: 'user005', userName: '二郎', departmentId: 'dept01', submitted: true, submittedAt: '2024-01-15T08:35:00Z' },
      { userId: 'user006', userName: '三郎', departmentId: 'dept01', submitted: true, submittedAt: '2024-01-15T08:40:00Z' },
      { userId: 'user007', userName: '四郎', departmentId: 'dept01', submitted: true, submittedAt: '2024-01-15T08:45:00Z' },
      { userId: 'user008', userName: '五郎', departmentId: 'dept01', submitted: true, submittedAt: '2024-01-15T08:50:00Z' },
      { userId: 'user009', userName: '六郎', departmentId: 'dept01', submitted: true, submittedAt: '2024-01-15T08:55:00Z' },
      { userId: 'user010', userName: '七郎', departmentId: 'dept01', submitted: true, submittedAt: '2024-01-15T09:00:00Z' }
    ];

    // Execute: 未送信者が存在する場合の部長への通知内容を生成
    const notificationContent = generateManagerNotificationContent({
      submissionStatus: reportSubmissionStatus,
      departmentId: 'dept01',
      meetingScheduledTime: '2024-01-15T09:30:00Z'
    });

    // Verify: 生成された通知内容の検証
    // (1) 未送信者の氏名リストに「太郎」「花子」「次郎」の3名が記載されていること
    expect(notificationContent.unsubmittedEmployeeNames).toEqual(['太郎', '花子', '次郎']);

    // (2) 未送信者数が「3名」と表示されていること
    expect(notificationContent.unsubmittedCount).toBe(3);

    // (3) 送信済み部員数が「7名」と表示されていること
    expect(notificationContent.submittedCount).toBe(7);

    // (4) 通知タイトルに「未送信者がいます」というメッセージが含まれていること
    expect(notificationContent.title).toContain('未送信者がいます');

    // Additional verification: 通知内容の整合性
    expect(notificationContent.totalEmployeeCount).toBe(10);
    expect(notificationContent.unsubmittedCount + notificationContent.submittedCount).toBe(notificationContent.totalEmployeeCount);
  });
});