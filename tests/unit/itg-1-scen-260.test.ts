import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

describe('朝会報告送信時に確認メールを自動配信する機能', () => {
  // SCEN-260
  test('部長メールアドレスが null のとき時刻遅延判定処理がエラーを返す', async () => {
    const { sendReportWithDelayNotification } = await import(
      '../../src/logic/it-1-br-1-1-1'
    );

    const reportData = {
      userId: 'eng-001',
      yesterdayAccomplishment: '機能A の実装完了',
      todayPlan: 'テスト実施',
      currentIssue: 'DBスキーマ確認待ち',
      sentAt: new Date('2024-01-15T08:30:00Z'),
    };

    const managerMailNull = {
      managerEmail: null,
      meetingStartTime: new Date('2024-01-15T09:00:00Z'),
    };

    expect(() =>
      sendReportWithDelayNotification(reportData, managerMailNull)
    ).toThrow(/部長メールアドレス/);
  });
});