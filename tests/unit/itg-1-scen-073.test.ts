import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { sendConfirmationEmailOnSubmit } from "../../src/logic/it-2";

const fetchMock = require("jest-fetch-mock");

describe("確認メール自動配信機能", () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-073
  test("部長情報がデータベースに存在しないときエラーとなる", async () => {
    const non_existent_manager_id = "MGR_NOT_FOUND_999";
    const report_id = "RPT_001";
    const employee_id = "EMP_001";
    const submission_timestamp = new Date("2024-01-15T08:30:00Z").toISOString();
    const report_content = {
      yesterday_achievement: "完了したタスク",
      today_plan: "本日の予定",
      current_issues: "現在の課題"
    };

    const report_data = {
      report_id: report_id,
      employee_id: employee_id,
      manager_id: non_existent_manager_id,
      submission_timestamp: submission_timestamp,
      report_content: report_content
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        error_code: "MANAGER_NOT_FOUND",
        error_message: `部長ID: ${non_existent_manager_id}の部長情報がデータベースに存在しません`,
        status: "error"
      }),
      { status: 404 }
    );

    await expect(sendConfirmationEmailOnSubmit(report_data)).rejects.toThrow(
      /部長情報/
    );
  });
});