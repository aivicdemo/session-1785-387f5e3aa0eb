import { describe, test, expect } from "@jest/globals";
import { judgeReportDelay } from "../../src/logic/it-1-br-1-1-1";

describe("朝会報告送信時刻遅延判定機能", () => {
  // SCEN-255
  test("朝会開始予定時刻が undefined のとき例外をスロー", () => {
    const submission_timestamp = new Date("2024-01-15T08:45:00Z").toISOString();
    const scheduled_start_time = undefined;

    expect(() =>
      judgeReportDelay({
        submission_timestamp: submission_timestamp,
        scheduled_start_time: scheduled_start_time,
      })
    ).toThrow(/朝会開始予定時刻/);
  });
});