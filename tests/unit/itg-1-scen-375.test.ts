import { isReportOverdue } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  test("SCEN-375: 朝会開始時刻より後に送信された報告は期限超過と判定される", () => {
    const morningMeetingStartTime = new Date("2024-01-15T09:00:00Z");
    const reportSubmissionTime = new Date("2024-01-15T09:01:00Z");

    const result = isReportOverdue(reportSubmissionTime, morningMeetingStartTime);

    expect(result).toBe(true);
  });
});