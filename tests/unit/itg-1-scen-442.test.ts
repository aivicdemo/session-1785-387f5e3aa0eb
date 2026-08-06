import { runPromptionLoopTermination } from "../../src/logic/it-1-br-1-1-1";

describe("催促ループ終了判定機能 - 複数未提出部員の同時停止", () => {
  test("SCEN-442: 複数の未提出部員が同じ催促試行回数で条件を満たす場合、全員の催促が同時に停止する", () => {
    const max_attempts = 3;
    const current_attempt = 2;

    const employee_a = {
      user_id: "EMP_001",
      name: "員工A",
      is_submitted: false,
      attempt_count: current_attempt,
      status: "active" as const,
    };

    const employee_b = {
      user_id: "EMP_002",
      name: "員工B",
      is_submitted: false,
      attempt_count: current_attempt,
      status: "active" as const,
    };

    const employee_c = {
      user_id: "EMP_003",
      name: "員工C",
      is_submitted: false,
      attempt_count: current_attempt,
      status: "active" as const,
    };

    const employees = [employee_a, employee_b, employee_c];

    const fixed_timestamp = new Date("2024-01-15T09:00:00Z");

    const result = runPromptionLoopTermination({
      employees,
      max_attempts,
      current_timestamp: fixed_timestamp,
    });

    expect(result.terminated_employee_ids).toEqual([
      "EMP_001",
      "EMP_002",
      "EMP_003",
    ]);
    expect(result.terminated_employee_ids).toHaveLength(3);

    expect(result.termination_status).toEqual("completed");

    expect(result.termination_records).toHaveLength(3);

    const rec_a = result.termination_records.find(
      (r) => r.user_id === "EMP_001"
    );
    const rec_b = result.termination_records.find(
      (r) => r.user_id === "EMP_002"
    );
    const rec_c = result.termination_records.find(
      (r) => r.user_id === "EMP_003"
    );

    expect(rec_a).toBeDefined();
    expect(rec_b).toBeDefined();
    expect(rec_c).toBeDefined();

    expect(rec_a?.is_promption_active).toBe(false);
    expect(rec_b?.is_promption_active).toBe(false);
    expect(rec_c?.is_promption_active).toBe(false);

    expect(rec_a?.loop_status).toBe("terminated");
    expect(rec_b?.loop_status).toBe("terminated");
    expect(rec_c?.loop_status).toBe("terminated");

    const ts_a = rec_a?.terminated_at;
    const ts_b = rec_b?.terminated_at;
    const ts_c = rec_c?.terminated_at;

    expect(ts_a).toBe(fixed_timestamp.toISOString());
    expect(ts_b).toBe(fixed_timestamp.toISOString());
    expect(ts_c).toBe(fixed_timestamp.toISOString());

    expect(ts_a).toEqual(ts_b);
    expect(ts_b).toEqual(ts_c);

    expect(result.termination_log).toContain(
      `3 promption loops terminated simultaneously at ${fixed_timestamp.toISOString()}`
    );
  });
});