import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { validateAndSubmitReport } from "../../src/logic/it-1";

describe("朝会報告送信制御機能", () => {
  // SCEN-143: [normal] 同一ユーザーが同一日付で2回目の送信を試みた場合に送信が拒否される
  test("should reject duplicate submission for same user on same date", async () => {
    const userId = "user-001";
    const reportDate = "2024-01-15";
    const firstSubmissionTime = new Date("2024-01-15T08:00:00Z");
    const secondSubmissionTime = new Date("2024-01-15T08:15:00Z");

    const reportContent = {
      userId: userId,
      reportDate: reportDate,
      yesterdayAccomplishment: "前日にタスクAを完了させた",
      todayPlan: "本日はタスクBに着手する予定",
      issuesFaced: "タスクAのレビューで指摘事項があった",
    };

    // Mock: 1回目の送信履歴を DB に登録済みの状態を再現
    const mockFirstSubmissionRecord = {
      userId: userId,
      reportDate: reportDate,
      submittedAt: firstSubmissionTime,
      status: "submitted" as const,
    };

    const mockSecondSubmissionAttempt = {
      userId: userId,
      reportDate: reportDate,
      submittedAt: secondSubmissionTime,
    };

    // 1回目の送信は成功する想定（前提条件）
    const firstResult = await validateAndSubmitReport({
      ...reportContent,
      submissionHistory: [], // 初回送信なので履歴なし
    });

    expect(firstResult).toEqual({
      success: true,
      recordId: expect.any(String),
      submittedAt: expect.any(Date),
      message: "朝会報告が送信されました",
    });

    // 2回目の送信は拒否されるべき
    const secondResult = await validateAndSubmitReport({
      ...reportContent,
      submissionHistory: [mockFirstSubmissionRecord], // 1回目の送信履歴を含める
    });

    expect(secondResult).toEqual({
      success: false,
      error: expect.stringMatching(/本日の朝会報告は既に送信済み/),
      isDuplicateSubmission: true,
    });

    // エラーメッセージが正確に含まれることを検証
    expect(secondResult.error).toMatch(/重複送信/);
  });
});