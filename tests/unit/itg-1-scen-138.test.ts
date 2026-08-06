import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { submitDailyReportWithEmailValidation } from "../../src/logic/it-1";

const fetchMock = require("jest-fetch-mock");

describe("日報入力フォームの提供と送信機能", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    jest.clearAllMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-138: [edge] 確認メール自動配信機能 - 送信内容の報告テキストが最大文字数を超える場合、メール送信の対象外となる
  test("報告テキストの合計文字数が最大文字数を超える場合、メール送信は実行されず、報告データのみ保存される", () => {
    const maxTotalCharacters = 3000;
    const yesterdayAccomplishment = "a".repeat(1500);
    const todayPlan = "b".repeat(1500);
    const currentIssue = "c".repeat(100);

    const totalCharacters =
      yesterdayAccomplishment.length +
      todayPlan.length +
      currentIssue.length;

    expect(totalCharacters).toBeGreaterThan(maxTotalCharacters);

    const reportData = {
      userId: "user123",
      departmentId: "dev_dept_001",
      reportDate: "2024-01-15",
      yesterdayAccomplishment: yesterdayAccomplishment,
      todayPlan: todayPlan,
      currentIssue: currentIssue,
      submittedAt: "2024-01-15T09:30:00Z",
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        reportId: "report_20240115_001",
        saved: true,
        emailSent: false,
        exceedsMaxCharacters: true,
      }),
      { status: 200 }
    );

    const result = submitDailyReportWithEmailValidation(
      reportData,
      maxTotalCharacters
    );

    expect(result).toEqual({
      reportId: "report_20240115_001",
      saved: true,
      emailSent: false,
      exceedsMaxCharacters: true,
    });

    expect(result.saved).toBe(true);
    expect(result.emailSent).toBe(false);
    expect(result.exceedsMaxCharacters).toBe(true);

    const callCount = fetchMock.mock.calls.length;
    expect(callCount).toBe(1);

    const lastCall = fetchMock.mock.calls[0];
    const requestUrl = lastCall[0];
    const requestBody = JSON.parse(lastCall[1].body);

    expect(requestUrl).toMatch(/\/api\/reports/);
    expect(requestBody).toEqual(reportData);

    const emailCallCount = fetchMock.mock.calls.filter((call: any[]) =>
      call[0].includes("email") || call[0].includes("mail")
    ).length;
    expect(emailCallCount).toBe(0);
  });
});