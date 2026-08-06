import { evaluateDailyReportSubmissionStatus } from "../../src/logic/it-1";

describe("日報送信状況判定機能", () => {
  // SCEN-211: [edge] 日報送信状況判定機能 - 朝会開始予定時刻の直前に全部員が未送信の場合、全員未送信と判定される
  test("朝会開始予定時刻の直前に全部員が未送信の場合、全員未送信と判定される", () => {
    const morning_assembly_scheduled_time = new Date(
      "2024-01-15T09:00:00Z"
    );
    const current_time = new Date("2024-01-15T08:59:00Z");

    const employee_count = 10;
    const submitted_employees: Array<{
      user_id: string;
      submitted_at: Date | null;
    }> = Array.from({ length: employee_count }, (_, index) => ({
      user_id: `ENG-${String(index + 1).padStart(3, "0")}`,
      submitted_at: null,
    }));

    const result = evaluateDailyReportSubmissionStatus({
      morning_assembly_scheduled_time,
      current_time,
      employee_submission_records: submitted_employees,
    });

    expect(result.all_submitted).toBe(false);
    expect(result.submitted_count).toBe(0);
    expect(result.not_submitted_count).toBe(10);
    expect(result.status).toBe("all_not_submitted");
    expect(result.not_submitted_employees).toHaveLength(10);
    expect(result.not_submitted_employees.map((emp) => emp.user_id)).toEqual([
      "ENG-001",
      "ENG-002",
      "ENG-003",
      "ENG-004",
      "ENG-005",
      "ENG-006",
      "ENG-007",
      "ENG-008",
      "ENG-009",
      "ENG-010",
    ]);
  });
});