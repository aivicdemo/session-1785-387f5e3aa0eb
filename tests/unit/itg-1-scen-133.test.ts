import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { sendConfirmationEmailIfDifferent } from "../../src/logic/it-1";

const fetchMock = require("jest-fetch-mock");
fetchMock.enableMocks();

describe("日報入力フォームの提供と送信機能", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // SCEN-133: [error] 確認メール自動配信機能 - 送信者と部長が同一人物のとき、メール送信処理が実行されない
  test("送信者と部長が同一人物のときメール送信が実行されない", async () => {
    const logSpy = jest
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
    const warnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);

    const user = {
      userId: "user001",
      name: "田中太郎",
      role: "部長",
      email: "tanaka@example.com",
    };

    const reportData = {
      reportId: "report001",
      senderId: "user001",
      yesterdayResult: "昨日の実績を記入",
      todayPlan: "本日の予定を記入",
      issues: "抱えている課題を記入",
      submittedAt: new Date("2024-01-15T08:30:00Z"),
    };

    const managerUserId = "user001";

    const result = await sendConfirmationEmailIfDifferent({
      reportData: reportData,
      senderUser: user,
      managerUserId: managerUserId,
    });

    expect(fetchMock).not.toHaveBeenCalled();

    expect(result).toEqual({
      success: true,
      mailSent: false,
      reason: "送信者と部長が同一人物のため、確認メール配信をスキップしました",
    });

    const logOutput = logSpy.mock.calls
      .map((call) => call[0])
      .join(" ");

    expect(logOutput).toMatch(/送信者と部長が同一人物/);
    expect(logOutput).toMatch(/確認メール配信をスキップ/);

    logSpy.mockRestore();
    warnSpy.mockRestore();
  });
});