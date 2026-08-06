import { validateAndSendReport } from '../../src/logic/it-1';

describe('朝会報告送信時の遅延判定機能', () => {
  test('SCEN-249: 送信時刻が朝会開始時刻より後の場合、遅延フラグがtrueとなる', () => {
    const meetingStartTime = new Date('2024-01-15T09:00:00Z');
    const submissionTime = new Date('2024-01-15T09:15:00Z');
    
    const report = {
      userId: 'user-001',
      yesterdayAccomplishment: '前日のタスク完了、ドキュメント作成',
      todayPlan: '本日は新機能開発とコードレビュー実施',
      currentIssues: '既知の問題: APIレスポンス時間が遅い',
      submittedAt: submissionTime,
      departmentId: 'dept-dev',
    };

    const result = validateAndSendReport(
      report,
      meetingStartTime
    );

    expect(result.isDelayed).toBe(true);
    expect(result.delayMinutes).toBe(15);
    expect(result.reportId).toBeDefined();
    expect(result.reportId.length).toBeGreaterThan(0);
    expect(result.submissionConfirmed).toBe(true);
    expect(result.managerNotificationSent).toBe(true);
    expect(result.notificationIncludesDelayInfo).toBe(true);
  });
});