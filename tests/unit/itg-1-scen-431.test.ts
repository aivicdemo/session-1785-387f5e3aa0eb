import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import fetchMock from "jest-fetch-mock";
import { stopPromptionByEmployeeId } from "../../src/logic/it-1-br-1-1-1";

fetchMock.enableMocks();

describe("報告送信時の自動確認メール配信機能 - 自動催促停止判定", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-431
  test("対象部員IDが空文字列のときエラーになる", () => {
    const emptyEmployeeId = "";
    const meetingStartTime = new Date("2024-01-15T09:00:00Z");
    const maxRetryCount = 3;

    expect(() =>
      stopPromptionByEmployeeId({
        employeeId: emptyEmployeeId,
        meetingStartTime: meetingStartTime,
        maxRetryCount: maxRetryCount,
      })
    ).toThrow(/部員ID/);

    expect(fetchMock.calls().length).toBe(0);
  });
});