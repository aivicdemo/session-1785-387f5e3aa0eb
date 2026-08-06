import { describe, it, expect, beforeEach } from "@jest/globals";
import { validateReportFormat } from "../../src/logic/it-1-br-1-1-1";

describe("Report Submission - Automatic Confirmation Email Delivery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-493
  it("should return warning status when today field is null in report format validation", () => {
    const report_input = {
      yesterday: "昨日完了したタスク",
      today: null,
      issue: "現在の課題",
    };

    const validation_result = validateReportFormat(report_input);

    expect(validation_result.status).toBe("warning");
    expect(validation_result.message).toContain("今日やること(today)が入力されていません");
    expect(validation_result.isValid).toBe(false);
  });
});