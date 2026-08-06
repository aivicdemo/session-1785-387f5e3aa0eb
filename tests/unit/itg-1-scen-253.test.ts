import { calculateDelay } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  test('SCEN-253: 遅延判定と同一入力での再実行 - 同じ送信時刻と朝会開始時刻で2回実行しても同じ遅延判定結果が得られる', () => {
    const morningMeetingStartTime = new Date('2024-01-15T09:00:00Z');
    const submissionTime = new Date('2024-01-15T09:15:00Z');
    const userId = 'engineer-001';

    const firstSubmissionData = {
      userId,
      yesterday: '昨日はAPIの実装を完了しました',
      today: '本日はテストを実施します',
      issues: '依存ライブラリのバージョン確認が必要です',
      submissionTime,
    };

    const firstDelayResult = calculateDelay(firstSubmissionData, morningMeetingStartTime);

    const secondSubmissionData = {
      userId,
      yesterday: '昨日はAPIの実装を完了しました',
      today: '本日はテストを実施します',
      issues: '依存ライブラリのバージョン確認が必要です',
      submissionTime,
    };

    const secondDelayResult = calculateDelay(secondSubmissionData, morningMeetingStartTime);

    expect(firstDelayResult.isDelayed).toBe(true);
    expect(firstDelayResult.delayMinutes).toBe(15);
    expect(secondDelayResult.isDelayed).toBe(true);
    expect(secondDelayResult.delayMinutes).toBe(15);
    expect(firstDelayResult.isDelayed).toBe(secondDelayResult.isDelayed);
    expect(firstDelayResult.delayMinutes).toBe(secondDelayResult.delayMinutes);
  });
});