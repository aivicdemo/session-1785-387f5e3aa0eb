import { validateMorningReportSubmission } from '../../src/logic/it-1';

describe('朝会報告送信検証機能', () => {
  // SCEN-099
  test('昨日の実績と本日の予定が両方空のとき送信を中止してエラーメッセージを表示する', () => {
    const submission_payload = {
      yesterday_achievement: '',
      today_plan: '',
      current_issues: '今日は顧客対応で手が離せない状況',
      user_id: 'eng_001',
      submission_timestamp: new Date('2024-01-15T08:30:00Z'),
    };

    expect(() => {
      validateMorningReportSubmission(submission_payload);
    }).toThrow(/昨日やったこと/);
  });
});