import { checkAllReportsComplete } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-352: [normal] 全員報告完了判定機能 - 同じ報告データで2回判定を実行しても同じ結果が返される
  test("同じ報告データで2回判定を実行しても同じ結果が返される", () => {
    const report_user_001 = {
      user_id: "user_001",
      department_id: "dept_001",
      yesterday_achievement: "タスクA完了",
      today_plan: "タスクB実施予定",
      issue: "進捗遅延なし",
      submitted_at: new Date("2024-01-15T09:00:00Z"),
    };

    const report_user_002 = {
      user_id: "user_002",
      department_id: "dept_001",
      yesterday_achievement: "タスクC完了",
      today_plan: "タスクD実施予定",
      issue: "リソース不足",
      submitted_at: new Date("2024-01-15T09:05:00Z"),
    };

    const report_user_003 = {
      user_id: "user_003",
      department_id: "dept_001",
      yesterday_achievement: "タスクE完了",
      today_plan: "タスクF実施予定",
      issue: "特になし",
      submitted_at: new Date("2024-01-15T09:10:00Z"),
    };

    const report_user_004 = {
      user_id: "user_004",
      department_id: "dept_001",
      yesterday_achievement: "タスクG完了",
      today_plan: "タスクH実施予定",
      issue: "依存関係を確認中",
      submitted_at: new Date("2024-01-15T09:15:00Z"),
    };

    const report_user_005 = {
      user_id: "user_005",
      department_id: "dept_001",
      yesterday_achievement: "タスクI完了",
      today_plan: "タスクJ実施予定",
      issue: "特になし",
      submitted_at: new Date("2024-01-15T09:20:00Z"),
    };

    const report_user_006 = {
      user_id: "user_006",
      department_id: "dept_001",
      yesterday_achievement: "タスクK完了",
      today_plan: "タスクL実施予定",
      issue: "要確認事項あり",
      submitted_at: new Date("2024-01-15T09:25:00Z"),
    };

    const report_user_007 = {
      user_id: "user_007",
      department_id: "dept_001",
      yesterday_achievement: "タスクM完了",
      today_plan: "タスクN実施予定",
      issue: "特になし",
      submitted_at: new Date("2024-01-15T09:30:00Z"),
    };

    const report_user_008 = {
      user_id: "user_008",
      department_id: "dept_001",
      yesterday_achievement: "タスクO完了",
      today_plan: "タスクP実施予定",
      issue: "進捗確認必要",
      submitted_at: new Date("2024-01-15T09:35:00Z"),
    };

    const report_user_009 = {
      user_id: "user_009",
      department_id: "dept_001",
      yesterday_achievement: "タスクQ完了",
      today_plan: "タスクR実施予定",
      issue: "特になし",
      submitted_at: new Date("2024-01-15T09:40:00Z"),
    };

    const report_user_010 = {
      user_id: "user_010",
      department_id: "dept_001",
      yesterday_achievement: "タスクS完了",
      today_plan: "タスクT実施予定",
      issue: "対応予定",
      submitted_at: new Date("2024-01-15T09:45:00Z"),
    };

    const all_reports = [
      report_user_001,
      report_user_002,
      report_user_003,
      report_user_004,
      report_user_005,
      report_user_006,
      report_user_007,
      report_user_008,
      report_user_009,
      report_user_010,
    ];

    const expected_check_time = new Date("2024-01-15T10:00:00Z");

    const result_first = checkAllReportsComplete(all_reports, expected_check_time);
    const result_second = checkAllReportsComplete(all_reports, expected_check_time);

    expect(result_first.is_all_complete).toBe(result_second.is_all_complete);
    expect(result_first.is_all_complete).toBe(true);
    expect(result_first.checked_at).toEqual(result_second.checked_at);
    expect(result_first.checked_at).toEqual(expected_check_time);

    if (
      result_first.incomplete_users &&
      result_second.incomplete_users !== undefined
    ) {
      expect(result_first.incomplete_users).toEqual(result_second.incomplete_users);
    } else if (result_first.incomplete_users === undefined) {
      expect(result_second.incomplete_users).toBeUndefined();
    }

    expect(result_first.total_submitted_count).toBe(
      result_second.total_submitted_count
    );
    expect(result_first.total_submitted_count).toBe(10);
  });
});