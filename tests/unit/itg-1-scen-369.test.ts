import { determineAllReportCompletionStatus } from "../../src/logic/it-1-br-1-1-1";

describe("全員報告完了判定機能 - 報告データ0件（全員未報告）の場合", () => {
  // SCEN-369
  test("10名全員がステータス『未報告』の催促対象者リストとして返却される", () => {
    const target_date = "2024-01-15";
    const target_user_ids = [
      "user001",
      "user002",
      "user003",
      "user004",
      "user005",
      "user006",
      "user007",
      "user008",
      "user009",
      "user010",
    ];
    const submitted_reports = [];

    const result = determineAllReportCompletionStatus({
      target_date: target_date,
      target_user_ids: target_user_ids,
      submitted_reports: submitted_reports,
    });

    expect(result).toEqual({
      all_submitted: false,
      pending_users: [
        {
          user_id: "user001",
          report_status: "未報告",
          is_prompt_target: true,
          yesterday_achievement: "未入力",
          today_plan: "未入力",
          issue: "未入力",
        },
        {
          user_id: "user002",
          report_status: "未報告",
          is_prompt_target: true,
          yesterday_achievement: "未入力",
          today_plan: "未入力",
          issue: "未入力",
        },
        {
          user_id: "user003",
          report_status: "未報告",
          is_prompt_target: true,
          yesterday_achievement: "未入力",
          today_plan: "未入力",
          issue: "未入力",
        },
        {
          user_id: "user004",
          report_status: "未報告",
          is_prompt_target: true,
          yesterday_achievement: "未入力",
          today_plan: "未入力",
          issue: "未入力",
        },
        {
          user_id: "user005",
          report_status: "未報告",
          is_prompt_target: true,
          yesterday_achievement: "未入力",
          today_plan: "未入力",
          issue: "未入力",
        },
        {
          user_id: "user006",
          report_status: "未報告",
          is_prompt_target: true,
          yesterday_achievement: "未入力",
          today_plan: "未入力",
          issue: "未入力",
        },
        {
          user_id: "user007",
          report_status: "未報告",
          is_prompt_target: true,
          yesterday_achievement: "未入力",
          today_plan: "未入力",
          issue: "未入力",
        },
        {
          user_id: "user008",
          report_status: "未報告",
          is_prompt_target: true,
          yesterday_achievement: "未入力",
          today_plan: "未入力",
          issue: "未入力",
        },
        {
          user_id: "user009",
          report_status: "未報告",
          is_prompt_target: true,
          yesterday_achievement: "未入力",
          today_plan: "未入力",
          issue: "未入力",
        },
        {
          user_id: "user010",
          report_status: "未報告",
          is_prompt_target: true,
          yesterday_achievement: "未入力",
          today_plan: "未入力",
          issue: "未入力",
        },
      ],
    });
    expect(result.all_submitted).toBe(false);
    expect(result.pending_users.length).toBe(10);
    expect(result.pending_users.every((u) => u.report_status === "未報告")).toBe(
      true
    );
    expect(result.pending_users.every((u) => u.is_prompt_target === true)).toBe(
      true
    );
  });
});