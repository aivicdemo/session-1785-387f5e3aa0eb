import { validateReportSubmissionDeadline } from "../../src/logic/it-1-br-1-1-1";

describe("報告期限判定機能", () => {
  test("SCEN-382: 朝会開始時刻が空文字列のとき、期限判定エラーをスロー", () => {
    const meeting_start_time_str = "";
    const report_submission_time_str = "2024-01-15T08:30:00Z";

    expect(() =>
      validateReportSubmissionDeadline(
        meeting_start_time_str,
        report_submission_time_str
      )
    ).toThrow(/朝会開始時刻/);
  });
});