import { describe, test, expect } from "@jest/globals";
import { judgeReportSubmissionTiming } from "../../src/logic/it-1-br-1-1-1";

describe("朝会報告送信時刻判定機能", () => {
  test("SCEN-273: 送信時刻が朝会開始時刻の1ミリ秒以上前の場合、遅延なしと判定される", () => {
    const meeting_start_time = new Date("2024-01-15T09:00:00.000Z");
    const report_submission_time = new Date("2024-01-15T08:59:59.999Z");

    const result = judgeReportSubmissionTiming({
      meeting_start_time: meeting_start_time,
      report_submission_time: report_submission_time,
    });

    expect(result.is_delayed).toBe(false);
    expect(result.judgment).toBe("遅延なし");
  });
});