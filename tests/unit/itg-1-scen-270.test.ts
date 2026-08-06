import { sendReportWithTimestampValidation } from '../../src/logic/it-1-br-1-1-1';

describe('朝会報告送信時に送信者本人と部長宛に確認メールを自動配信する機能', () => {
  // SCEN-270
  test('報告送信タイムスタンプが朝会開始予定時刻より前の日付のときエラーで失敗する', () => {
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');
    const reportSubmissionTimestamp = new Date('2024-01-14T08:30:00Z');
    const reportContent = {
      yesterdayAccomplishment: 'タスクA完了',
      todayPlan: 'タスクB開始',
      currentIssue: '課題なし',
    };

    expect(() =>
      sendReportWithTimestampValidation(
        reportSubmissionTimestamp,
        morningMeetingStartTime,
        reportContent
      )
    ).toThrow(/朝会開始時刻以降/);
  });
});