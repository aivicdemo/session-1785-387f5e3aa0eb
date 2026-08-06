import { validateAndSubmitReport } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  test('SCEN-155: 同一ユーザーが同一日付で2回目送信を試みた時点で送信が拒否される', () => {
    const user_id = 'user_001';
    const submission_date = '2024-01-15';
    const yesterday_work = '昨日は機能A の開発を完了しました';
    const today_plan = '本日は機能B のテストを実施します';
    const current_issue = '依存モジュールの遅延が懸念されます';

    const first_submission_input = {
      user_id,
      submission_date,
      yesterday_work,
      today_plan,
      current_issue,
    };

    // First submission should succeed
    const first_result = validateAndSubmitReport(first_submission_input);
    expect(first_result.success).toBe(true);
    expect(first_result.message).toBe('日報が正常に送信されました');
    expect(first_result.send_confirmation_email).toBe(true);

    // Second submission on same date with same user should fail
    const second_submission_input = {
      user_id,
      submission_date,
      yesterday_work: '異なる内容：昨日は機能C のレビューを実施しました',
      today_plan: '異なる内容：本日は機能D のバグ修正を行います',
      current_issue: '異なる内容：新しい要件の仕様確認が必要です',
    };

    expect(() => {
      validateAndSubmitReport(second_submission_input);
    }).toThrow(/既に送信済み/);
  });
});