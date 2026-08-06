import { checkDuplicateReportSubmission } from '../../src/logic/it-1';

describe('日報送信重複チェック機能', () => {
  test('SCEN-157: [edge] 送信日時が日付の境界を跨ぐ場合、異なる日付として認識される', () => {
    const userId = 'user-a-001';
    const departmentId = 'dept-dev-001';

    // 1. 23時59分59秒にユーザーAが日報を送信
    const firstSubmitTime = new Date('2024-01-15T23:59:59Z');
    const firstReportContent = {
      userId,
      departmentId,
      yesterday: 'バグ修正を完了した',
      today: 'レビュー対応を実施する',
      issues: 'データベース接続タイムアウトの問題',
      submittedAt: firstSubmitTime,
    };

    const firstCheckResult = checkDuplicateReportSubmission(firstReportContent);

    // 1件目は初送信なので許可される
    expect(firstCheckResult.isDuplicate).toBe(false);
    expect(firstCheckResult.submittedDate).toBe('2024-01-15');
    expect(firstCheckResult.allowSubmission).toBe(true);

    // 2. 00時00分00秒（日付が変わった）にユーザーAが新しい日報を送信
    const secondSubmitTime = new Date('2024-01-16T00:00:00Z');
    const secondReportContent = {
      userId,
      departmentId,
      yesterday: 'レビュー対応を完了した',
      today: 'テスト実行を開始する',
      issues: 'テスト環境のセットアップに遅延',
      submittedAt: secondSubmitTime,
    };

    const secondCheckResult = checkDuplicateReportSubmission(secondReportContent);

    // 2件目は異なる日付なので許可される
    expect(secondCheckResult.isDuplicate).toBe(false);
    expect(secondCheckResult.submittedDate).toBe('2024-01-16');
    expect(secondCheckResult.allowSubmission).toBe(true);

    // 3. 両日報が異なる日付として認識されていることを確認
    expect(firstCheckResult.submittedDate).not.toBe(secondCheckResult.submittedDate);

    // 4. 両日報が確認メール送信対象として登録されるべき状態を確認
    expect(firstCheckResult.shouldSendConfirmationEmail).toBe(true);
    expect(secondCheckResult.shouldSendConfirmationEmail).toBe(true);
  });
});