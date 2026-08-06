import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { getReportArrivalStatus } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-444
  test("報告到着状況の把握機能 - 10名全員から報告が到着済みの場合、到着済み件数が10件と判定される", () => {
    const user_ids = [
      "user_001",
      "user_002",
      "user_003",
      "user_004",
      "user_005",
      "user_006",
      "user_007",
      "user_008",
      "user_009",
      "user_010",
    ];

    const reports = [
      {
        user_id: "user_001",
        yesterday_achievement: "昨日はAタスクを完了した",
        today_plan: "本日はBタスクに着手する",
        current_issue: "リソース不足が課題",
        submitted_at: "2024-01-15T08:00:00Z",
      },
      {
        user_id: "user_002",
        yesterday_achievement: "昨日はCタスクを完了した",
        today_plan: "本日はDタスクに着手する",
        current_issue: "スケジュール遅延が課題",
        submitted_at: "2024-01-15T08:01:00Z",
      },
      {
        user_id: "user_003",
        yesterday_achievement: "昨日はEタスクを完了した",
        today_plan: "本日はFタスクに着手する",
        current_issue: "仕様不明が課題",
        submitted_at: "2024-01-15T08:02:00Z",
      },
      {
        user_id: "user_004",
        yesterday_achievement: "昨日はGタスクを完了した",
        today_plan: "本日はHタスクに着手する",
        current_issue: "品質リスクが課題",
        submitted_at: "2024-01-15T08:03:00Z",
      },
      {
        user_id: "user_005",
        yesterday_achievement: "昨日はIタスクを完了した",
        today_plan: "本日はJタスクに着手する",
        current_issue: "コミュニケーション不足が課題",
        submitted_at: "2024-01-15T08:04:00Z",
      },
      {
        user_id: "user_006",
        yesterday_achievement: "昨日はKタスクを完了した",
        today_plan: "本日はLタスクに着手する",
        current_issue: "外部依存が課題",
        submitted_at: "2024-01-15T08:05:00Z",
      },
      {
        user_id: "user_007",
        yesterday_achievement: "昨日はMタスクを完了した",
        today_plan: "本日はNタスクに着手する",
        current_issue: "インフラ問題が課題",
        submitted_at: "2024-01-15T08:06:00Z",
      },
      {
        user_id: "user_008",
        yesterday_achievement: "昨日はOタスクを完了した",
        today_plan: "本日はPタスクに着手する",
        current_issue: "テスト不足が課題",
        submitted_at: "2024-01-15T08:07:00Z",
      },
      {
        user_id: "user_009",
        yesterday_achievement: "昨日はQタスクを完了した",
        today_plan: "本日はRタスクに着手する",
        current_issue: "ドキュメント未整備が課題",
        submitted_at: "2024-01-15T08:08:00Z",
      },
      {
        user_id: "user_010",
        yesterday_achievement: "昨日はSタスクを完了した",
        today_plan: "本日はTタスクに着手する",
        current_issue: "人員確保が課題",
        submitted_at: "2024-01-15T08:09:00Z",
      },
    ];

    const result = getReportArrivalStatus(reports, user_ids);

    expect(result.arrived_count).toBe(10);
  });
});