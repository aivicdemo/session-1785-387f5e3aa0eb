import { describe, test, expect } from "@jest/globals";
import { judgeReportSubmissionStatus } from "../../src/logic/it-1";

describe("朝会報告送信状況判定機能", () => {
  test("SCEN-196: 部員数が0人の場合、全員送信完了と判定される", () => {
    const totalMembers = 0;
    const submittedMembers = 0;

    const result = judgeReportSubmissionStatus({
      totalMembers,
      submittedMembers,
    });

    expect(result).toEqual({
      allSubmitted: true,
      submissionRate: 100,
      pendingCount: 0,
    });
  });
});