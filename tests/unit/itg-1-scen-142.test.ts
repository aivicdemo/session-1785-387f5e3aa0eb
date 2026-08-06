import { submitMorningReport } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-142: [normal] 朝会報告送信制御機能 - 初回送信時に送信者のユーザーIDと送信日時が記録される
  test('初回送信時に送信者のユーザーIDと送信日時が記録される', () => {
    const user_id = 'user_001';
    const yesterday_achievement = '昨日の実績を完了しました';
    const today_plan = '本日の予定を実行します';
    const current_issue = '現在の課題に対応中です';
    const submission_timestamp = new Date('2024-01-15T08:30:00Z');

    const result = submitMorningReport({
      user_id: user_id,
      yesterday_achievement: yesterday_achievement,
      today_plan: today_plan,
      current_issue: current_issue,
      submission_timestamp: submission_timestamp,
    });

    expect(result.record_id).toBeDefined();
    expect(result.submitted_user_id).toBe('user_001');
    expect(result.submitted_timestamp).toEqual(new Date('2024-01-15T08:30:00Z'));
    expect(result.submission_status).toBe('submitted');
  });
});