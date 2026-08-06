import { validateReportSubmissionDuplication } from '../../src/logic/it-1';

describe('日報送信重複チェック機能', () => {
  test('SCEN-146: 送信者ユーザーIDが null のとき送信を拒否する', () => {
    const report_content = {
      yesterday_achievement: '昨日は機能Aの実装を完了しました',
      today_plan: '本日は機能Bのテストを実施予定です',
      current_issues: '現在、外部APIの仕様確認に時間がかかっています',
    };

    const submission_params = {
      user_id: null,
      report_date: '2024-01-15',
      content: report_content,
    };

    expect(() => {
      validateReportSubmissionDuplication(submission_params);
    }).toThrow(/ユーザーID/);
  });
});