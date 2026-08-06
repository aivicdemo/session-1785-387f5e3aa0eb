import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import fetchMock from "jest-fetch-mock";
import { notifyUnsentReports } from "../../src/logic/it-1-br-1-1-1";

describe("未提出部員通知機能 - 朝会開始予定時刻が null のときのエラー処理", () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-427
  test("朝会開始予定時刻が null のとき、例外をスロー、メール送信処理は実行されない", () => {
    const departmentId = "dev-dept-001";
    const morningMeetingStartTimeJst = null;
    const targetDateJst = "2024-01-15";
    const departmentManagerEmailAddress = "manager@company.com";

    expect(() => {
      notifyUnsentReports(
        departmentId,
        morningMeetingStartTimeJst,
        targetDateJst,
        departmentManagerEmailAddress
      );
    }).toThrow(/時刻/);

    expect(fetchMock).not.toHaveFetched();
  });
});