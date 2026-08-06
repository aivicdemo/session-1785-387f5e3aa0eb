import { describe, test, expect, beforeEach } from "@jest/globals";
import { extractUniqueReportsAndCheckStatus } from "../../src/logic/it-1-br-1-1-1";

describe("報告送信時に、送信者本人と部長宛に確認メールを自動配信する機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-471
  test("10名中11名のデータが含まれている場合、重複データを除外して正確に状態判定される", () => {
    const user_a_id = "USR_001";
    const user_b_id = "USR_002";
    const user_c_id = "USR_003";
    const user_d_id = "USR_004";
    const user_e_id = "USR_005";
    const user_f_id = "USR_006";
    const user_g_id = "USR_007";
    const user_h_id = "USR_008";
    const user_i_id = "USR_009";
    const user_j_id = "USR_010";

    const registered_user_ids = [
      user_a_id,
      user_b_id,
      user_c_id,
      user_d_id,
      user_e_id,
      user_f_id,
      user_g_id,
      user_h_id,
      user_i_id,
      user_j_id,
    ];

    const morning_meeting_time = new Date("2024-01-15T09:00:00Z");

    const report_data_with_duplicate = [
      {
        report_id: "RPT_001",
        user_id: user_a_id,
        sent_at: new Date("2024-01-15T08:50:00Z"),
        yesterday_result: "Task A completed",
        today_plan: "Task B planned",
        issue: "None",
      },
      {
        report_id: "RPT_002",
        user_id: user_b_id,
        sent_at: new Date("2024-01-15T08:52:00Z"),
        yesterday_result: "Task C completed",
        today_plan: "Task D planned",
        issue: "None",
      },
      {
        report_id: "RPT_003",
        user_id: user_c_id,
        sent_at: new Date("2024-01-15T08:54:00Z"),
        yesterday_result: "Task E completed",
        today_plan: "Task F planned",
        issue: "None",
      },
      {
        report_id: "RPT_004",
        user_id: user_d_id,
        sent_at: new Date("2024-01-15T08:56:00Z"),
        yesterday_result: "Task G completed",
        today_plan: "Task H planned",
        issue: "None",
      },
      {
        report_id: "RPT_005",
        user_id: user_e_id,
        sent_at: new Date("2024-01-15T08:58:00Z"),
        yesterday_result: "Task I completed",
        today_plan: "Task J planned",
        issue: "None",
      },
      {
        report_id: "RPT_006",
        user_id: user_f_id,
        sent_at: new Date("2024-01-15T08:45:00Z"),
        yesterday_result: "Task K completed",
        today_plan: "Task L planned",
        issue: "None",
      },
      {
        report_id: "RPT_007",
        user_id: user_g_id,
        sent_at: new Date("2024-01-15T08:47:00Z"),
        yesterday_result: "Task M completed",
        today_plan: "Task N planned",
        issue: "None",
      },
      {
        report_id: "RPT_008",
        user_id: user_h_id,
        sent_at: new Date("2024-01-15T08:49:00Z"),
        yesterday_result: "Task O completed",
        today_plan: "Task P planned",
        issue: "None",
      },
      {
        report_id: "RPT_009",
        user_id: user_i_id,
        sent_at: new Date("2024-01-15T08:51:00Z"),
        yesterday_result: "Task Q completed",
        today_plan: "Task R planned",
        issue: "None",
      },
      {
        report_id: "RPT_010",
        user_id: user_j_id,
        sent_at: new Date("2024-01-15T08:53:00Z"),
        yesterday_result: "Task S completed",
        today_plan: "Task T planned",
        issue: "None",
      },
      {
        report_id: "RPT_011",
        user_id: user_a_id,
        sent_at: new Date("2024-01-15T08:55:00Z"),
        yesterday_result: "Task A2 completed (duplicate)",
        today_plan: "Task B2 planned (duplicate)",
        issue: "Duplicate",
      },
    ];

    const result = extractUniqueReportsAndCheckStatus({
      reports: report_data_with_duplicate,
      registered_user_ids: registered_user_ids,
      morning_meeting_time: morning_meeting_time,
    });

    expect(result.unique_report_count).toBe(10);
    expect(result.total_report_count).toBe(11);
    expect(result.duplicate_report_count).toBe(1);
    expect(result.arrived_user_count).toBe(10);
    expect(result.expected_user_count).toBe(10);
    expect(result.all_reports_arrived).toBe(true);
    expect(result.unique_reports).toHaveLength(10);

    const user_ids_in_unique_reports = result.unique_reports
      .map((report) => report.user_id)
      .sort();
    const expected_user_ids = registered_user_ids.sort();
    expect(user_ids_in_unique_reports).toEqual(expected_user_ids);

    const user_a_report = result.unique_reports.find(
      (report) => report.user_id === user_a_id
    );
    expect(user_a_report).toBeDefined();
    expect(user_a_report?.report_id).toBe("RPT_001");
    expect(user_a_report?.yesterday_result).toBe("Task A completed");
    expect(user_a_report?.today_plan).toBe("Task B planned");
    expect(user_a_report?.sent_at).toEqual(new Date("2024-01-15T08:50:00Z"));

    const on_time_reports = result.unique_reports.filter(
      (report) => report.sent_at <= morning_meeting_time
    );
    expect(on_time_reports).toHaveLength(10);

    const delayed_reports = result.unique_reports.filter(
      (report) => report.sent_at > morning_meeting_time
    );
    expect(delayed_reports).toHaveLength(0);

    expect(result.status_message).toMatch(/10名中10名/);
    expect(result.status_message).toMatch(/報告を受け取り済み/);
  });
});