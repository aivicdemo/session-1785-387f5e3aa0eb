import { describe, test, expect, beforeEach } from "@jest/globals";
import { judgePromptLoopTermination } from "../../src/logic/it-1-br-1-1-1";

describe("催促ループ終了判定機能 - idempotent retry", () => {
  // SCEN-408
  test("同じ催促対象者に対して同じ終了条件で2回実行しても、同じ終了結果になる", () => {
    const member_id = "MEM-001";
    const member_name = "部員A";
    const termination_condition = "report_submitted";

    const report_submitted_timestamp = new Date("2024-01-15T09:30:00Z");
    const morning_meeting_start_time = new Date("2024-01-15T09:00:00Z");

    const input_first = {
      member_id: member_id,
      member_name: member_name,
      termination_condition: termination_condition,
      report_submitted_at: report_submitted_timestamp,
      meeting_start_at: morning_meeting_start_time,
    };

    const result_first = judgePromptLoopTermination(input_first);

    const input_second = {
      member_id: member_id,
      member_name: member_name,
      termination_condition: termination_condition,
      report_submitted_at: report_submitted_timestamp,
      meeting_start_at: morning_meeting_start_time,
    };

    const result_second = judgePromptLoopTermination(input_second);

    expect(result_first).toEqual(result_second);
    expect(result_first.should_terminate).toBe(true);
    expect(result_first.member_id).toBe(member_id);
    expect(result_first.termination_reason).toBe(termination_condition);
  });
});