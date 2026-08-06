import { describe, test, expect, beforeEach } from "@jest/globals";
import { submitDailyReport } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-154: [edge] 日報送信重複チェック機能 - 同一ユーザーが同一日付で初回送信時に送信者ユーザーIDと送信日時が正確に記録される
  test("同一ユーザーが同一日付で初回送信する場合、送信者ユーザーIDと送信日時が秒単位まで正確に記録される", () => {
    const userId = "user-001";
    const reportDate = "2024-01-15";
    const submissionTimestamp = "2024-01-15T09:30:45Z";
    const yesterdayAccomplishment = "レビュー対応";
    const todayPlan = "機能開発";
    const currentChallenge = "環境構築の遅れ";

    const result = submitDailyReport({
      userId,
      reportDate,
      submissionTimestamp,
      yesterdayAccomplishment,
      todayPlan,
      currentChallenge,
    });

    expect(result.userId).toBe("user-001");
    expect(result.reportDate).toBe("2024-01-15");
    expect(result.submissionTimestamp).toBe("2024-01-15T09:30:45Z");
    expect(result.isFirstSubmissionOfDay).toBe(true);
    expect(result.yesterdayAccomplishment).toBe("レビュー対応");
    expect(result.todayPlan).toBe("機能開発");
    expect(result.currentChallenge).toBe("環境構築の遅れ");
  });
});