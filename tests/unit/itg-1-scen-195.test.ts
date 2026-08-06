import { checkMorningReportSubmissionStatus } from "../../src/logic/it-1";

describe("朝会報告送信状況判定機能", () => {
  // SCEN-195
  test("1名の未送信者が存在する場合、その1名が未送信者として判定される", () => {
    const submitted_employee_1 = {
      employee_id: "E001",
      employee_name: "太郎",
      report_date: "2024-01-15",
      yesterday_achievement: "機能A開発完了",
      today_plan: "機能B開発開始",
      current_issue: "リソース不足",
      submitted_at: "2024-01-15T07:00:00Z",
    };

    const submitted_employee_2 = {
      employee_id: "E002",
      employee_name: "花子",
      report_date: "2024-01-15",
      yesterday_achievement: "テスト実施",
      today_plan: "バグ修正",
      current_issue: "なし",
      submitted_at: "2024-01-15T07:15:00Z",
    };

    const submitted_employee_3 = {
      employee_id: "E003",
      employee_name: "次郎",
      report_date: "2024-01-15",
      yesterday_achievement: "ドキュメント作成",
      today_plan: "レビュー対応",
      current_issue: "期限の遅延",
      submitted_at: "2024-01-15T07:30:00Z",
    };

    const submitted_employee_4 = {
      employee_id: "E004",
      employee_name: "美咲",
      report_date: "2024-01-15",
      yesterday_achievement: "デプロイ作業",
      today_plan: "監視・対応",
      current_issue: "なし",
      submitted_at: "2024-01-15T07:45:00Z",
    };

    const submitted_employee_5 = {
      employee_id: "E005",
      employee_name: "健太",
      report_date: "2024-01-15",
      yesterday_achievement: "環境構築",
      today_plan: "統合テスト",
      current_issue: "ネットワーク遅延",
      submitted_at: "2024-01-15T08:00:00Z",
    };

    const submitted_employee_6 = {
      employee_id: "E006",
      employee_name: "由紀",
      report_date: "2024-01-15",
      yesterday_achievement: "コードレビュー",
      today_plan: "マージ作業",
      current_issue: "なし",
      submitted_at: "2024-01-15T08:15:00Z",
    };

    const submitted_employee_7 = {
      employee_id: "E007",
      employee_name: "翔太",
      report_date: "2024-01-15",
      yesterday_achievement: "バグ修正",
      today_plan: "本番対応準備",
      current_issue: "セキュリティ問題",
      submitted_at: "2024-01-15T08:30:00Z",
    };

    const submitted_employee_8 = {
      employee_id: "E008",
      employee_name: "奈美",
      report_date: "2024-01-15",
      yesterday_achievement: "パフォーマンス計測",
      today_plan: "最適化作業",
      current_issue: "なし",
      submitted_at: "2024-01-15T08:45:00Z",
    };

    const submitted_employee_9 = {
      employee_id: "E009",
      employee_name: "拓也",
      report_date: "2024-01-15",
      yesterday_achievement: "テスト自動化",
      today_plan: "CI/CD設定",
      current_issue: "スクリプトエラー",
      submitted_at: "2024-01-15T09:00:00Z",
    };

    const unsubmitted_employee = {
      employee_id: "E010",
      employee_name: "麻衣",
      report_date: "2024-01-15",
      yesterday_achievement: null,
      today_plan: null,
      current_issue: null,
      submitted_at: null,
    };

    const all_employees = [
      submitted_employee_1,
      submitted_employee_2,
      submitted_employee_3,
      submitted_employee_4,
      submitted_employee_5,
      submitted_employee_6,
      submitted_employee_7,
      submitted_employee_8,
      submitted_employee_9,
      unsubmitted_employee,
    ];

    const report_deadline = "2024-01-15T09:30:00Z";

    const result = checkMorningReportSubmissionStatus(
      all_employees,
      report_deadline
    );

    expect(result.unsubmitted_count).toBe(1);
    expect(result.submitted_count).toBe(9);
    expect(result.unsubmitted_employees).toHaveLength(1);
    expect(result.unsubmitted_employees[0]).toEqual({
      employee_id: "E010",
      employee_name: "麻衣",
    });
  });
});