import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  judgeReportSubmissionStatus,
  type JudgeReportSubmissionStatusInput,
  type JudgeReportSubmissionStatusOutput,
} from "../../src/logic/it-1";

describe("日報送信状況判定機能", () => {
  // SCEN-218
  test("最大規模の部門人数（全社員数）に対して送信状況判定が正確に実行される", () => {
    const total_employees = 10;
    const submitted_count = 7;
    const not_submitted_count = 3;

    const submitted_employee_ids = [
      "EMP001",
      "EMP002",
      "EMP003",
      "EMP004",
      "EMP005",
      "EMP006",
      "EMP007",
    ];
    const not_submitted_employee_ids = ["EMP008", "EMP009", "EMP010"];

    const input: JudgeReportSubmissionStatusInput = {
      total_employees: total_employees,
      submitted_employee_ids: submitted_employee_ids,
      not_submitted_employee_ids: not_submitted_employee_ids,
    };

    const start_time = Date.now();
    const result: JudgeReportSubmissionStatusOutput =
      judgeReportSubmissionStatus(input);
    const execution_time_ms = Date.now() - start_time;

    expect(result.submitted_count).toBe(submitted_count);
    expect(result.not_submitted_count).toBe(not_submitted_count);
    expect(result.submitted_employee_ids).toEqual(submitted_employee_ids);
    expect(result.submitted_employee_ids.length).toBe(submitted_count);
    expect(result.not_submitted_employee_ids).toEqual(
      not_submitted_employee_ids
    );
    expect(result.not_submitted_employee_ids.length).toBe(not_submitted_count);
    expect(execution_time_ms).toBeLessThan(5000);
  });
});