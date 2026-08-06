import { getReportStatusList } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-222
  test("報告漏れ部員の視認機能 - 複数部員中で報告を送信していない部員が識別できる", () => {
    const submitted_user_ids = ["user001", "user002", "user003", "user004", "user005"];
    const unsubmitted_user_ids = ["user006", "user007", "user008", "user009", "user010"];
    const all_user_ids = [...submitted_user_ids, ...unsubmitted_user_ids];

    const mock_reports = [
      {
        user_id: "user001",
        yesterday_achievement: "タスクAを完了",
        today_plan: "タスクBを開始",
        issues: "なし",
        submitted_at: new Date("2024-01-15T08:30:00Z"),
      },
      {
        user_id: "user002",
        yesterday_achievement: "ドキュメント作成",
        today_plan: "レビュー対応",
        issues: "なし",
        submitted_at: new Date("2024-01-15T08:25:00Z"),
      },
      {
        user_id: "user003",
        yesterday_achievement: "バグ修正",
        today_plan: "テスト実行",
        issues: "なし",
        submitted_at: new Date("2024-01-15T08:40:00Z"),
      },
      {
        user_id: "user004",
        yesterday_achievement: "機能実装",
        today_plan: "統合テスト",
        issues: "なし",
        submitted_at: new Date("2024-01-15T08:20:00Z"),
      },
      {
        user_id: "user005",
        yesterday_achievement: "データ確認",
        today_plan: "分析実施",
        issues: "なし",
        submitted_at: new Date("2024-01-15T08:35:00Z"),
      },
    ];

    const result = getReportStatusList({
      all_user_ids: all_user_ids,
      submitted_reports: mock_reports,
      report_date: "2024-01-15",
    });

    expect(result).toEqual({
      submitted_count: 5,
      unsubmitted_count: 5,
      statuses: [
        {
          user_id: "user001",
          status: "報告済み",
          yesterday_achievement: "タスクAを完了",
          today_plan: "タスクBを開始",
          issues: "なし",
          submitted_at: "2024-01-15T08:30:00Z",
        },
        {
          user_id: "user002",
          status: "報告済み",
          yesterday_achievement: "ドキュメント作成",
          today_plan: "レビュー対応",
          issues: "なし",
          submitted_at: "2024-01-15T08:25:00Z",
        },
        {
          user_id: "user003",
          status: "報告済み",
          yesterday_achievement: "バグ修正",
          today_plan: "テスト実行",
          issues: "なし",
          submitted_at: "2024-01-15T08:40:00Z",
        },
        {
          user_id: "user004",
          status: "報告済み",
          yesterday_achievement: "機能実装",
          today_plan: "統合テスト",
          issues: "なし",
          submitted_at: "2024-01-15T08:20:00Z",
        },
        {
          user_id: "user005",
          status: "報告済み",
          yesterday_achievement: "データ確認",
          today_plan: "分析実施",
          issues: "なし",
          submitted_at: "2024-01-15T08:35:00Z",
        },
        {
          user_id: "user006",
          status: "報告未提出",
          yesterday_achievement: "",
          today_plan: "",
          issues: "",
          submitted_at: null,
        },
        {
          user_id: "user007",
          status: "報告未提出",
          yesterday_achievement: "",
          today_plan: "",
          issues: "",
          submitted_at: null,
        },
        {
          user_id: "user008",
          status: "報告未提出",
          yesterday_achievement: "",
          today_plan: "",
          issues: "",
          submitted_at: null,
        },
        {
          user_id: "user009",
          status: "報告未提出",
          yesterday_achievement: "",
          today_plan: "",
          issues: "",
          submitted_at: null,
        },
        {
          user_id: "user010",
          status: "報告未提出",
          yesterday_achievement: "",
          today_plan: "",
          issues: "",
          submitted_at: null,
        },
      ],
    });
  });
});