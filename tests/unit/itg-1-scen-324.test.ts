import { prioritizeReminderTargets } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-324: [normal] 催促対象部員の優先順位付け機能 - 同じ入力で2回実行した場合、両回で同じ優先順位結果が得られる
  test("should return identical priority order on repeated execution with same input data", () => {
    const input_employee_id_list = [
      "EMP001",
      "EMP002",
      "EMP003",
      "EMP004",
      "EMP005",
      "EMP006",
      "EMP007",
      "EMP008",
      "EMP009",
      "EMP010",
    ];

    const report_deadline_timestamp = new Date("2024-01-15T08:00:00Z").getTime();

    const employee_report_status = [
      {
        employee_id: "EMP001",
        has_submitted: false,
        submitted_at_timestamp: null,
      },
      {
        employee_id: "EMP002",
        has_submitted: true,
        submitted_at_timestamp: new Date("2024-01-15T07:50:00Z").getTime(),
      },
      {
        employee_id: "EMP003",
        has_submitted: false,
        submitted_at_timestamp: null,
      },
      {
        employee_id: "EMP004",
        has_submitted: true,
        submitted_at_timestamp: new Date("2024-01-15T08:30:00Z").getTime(),
      },
      {
        employee_id: "EMP005",
        has_submitted: false,
        submitted_at_timestamp: null,
      },
      {
        employee_id: "EMP006",
        has_submitted: true,
        submitted_at_timestamp: new Date("2024-01-15T07:30:00Z").getTime(),
      },
      {
        employee_id: "EMP007",
        has_submitted: false,
        submitted_at_timestamp: null,
      },
      {
        employee_id: "EMP008",
        has_submitted: true,
        submitted_at_timestamp: new Date("2024-01-15T09:00:00Z").getTime(),
      },
      {
        employee_id: "EMP009",
        has_submitted: false,
        submitted_at_timestamp: null,
      },
      {
        employee_id: "EMP010",
        has_submitted: true,
        submitted_at_timestamp: new Date("2024-01-15T07:45:00Z").getTime(),
      },
    ];

    const first_execution_result = prioritizeReminderTargets(
      input_employee_id_list,
      report_deadline_timestamp,
      employee_report_status
    );

    const second_execution_result = prioritizeReminderTargets(
      input_employee_id_list,
      report_deadline_timestamp,
      employee_report_status
    );

    expect(first_execution_result).toEqual(second_execution_result);

    const prioritized_employee_ids = first_execution_result.map(
      (item) => item.employee_id
    );
    const expected_order = [
      "EMP001",
      "EMP003",
      "EMP005",
      "EMP007",
      "EMP009",
      "EMP004",
      "EMP008",
      "EMP006",
      "EMP010",
      "EMP002",
    ];
    expect(prioritized_employee_ids).toEqual(expected_order);
  });
});