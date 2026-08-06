import { describe, it, expect, beforeEach } from "@jest/globals";

describe("朝会報告送信時刻遅延判定機能", () => {
  it("SCEN-254: 朝会開始予定時刻が null のとき処理が失敗する", async () => {
    const { judgeReportSubmissionDelay } = await import(
      "../../src/logic/it-1-br-1-1-1"
    );

    const reportSubmissionTime = new Date("2024-01-15T09:30:00Z");
    const meetingStartScheduledTime = null;

    expect(() => {
      judgeReportSubmissionDelay(
        reportSubmissionTime,
        meetingStartScheduledTime
      );
    }).toThrow(/朝会開始予定時刻/);
  });
});