import { describe, test, expect } from "@jest/globals";
import { notifyConfirmationEmailsOnReportSubmission } from "../../src/logic/it-1-br-1-1-1";

describe("報告送信時の確認メール自動配信機能", () => {
  // SCEN-464
  test("朝会報告データが空配列のとき、エラーが発生する", () => {
    const empty_reports = [];
    const submitter_user_id = "user_123";
    const department_head_user_id = "user_456";
    const submission_timestamp = new Date("2024-01-15T09:30:00Z");

    expect(() =>
      notifyConfirmationEmailsOnReportSubmission({
        reports: empty_reports,
        submitter_user_id: submitter_user_id,
        department_head_user_id: department_head_user_id,
        submission_timestamp: submission_timestamp,
      })
    ).toThrow(/報告データ|報告一覧/);
  });
});