import { aggregateReportsByDepartment } from "../../src/logic/it-1-br-1-1-1";

describe("報告到着状況把握機能 - 部門別集計", () => {
  // SCEN-476
  test("複数の部門にまたがる部員10名全体の報告到着状況が、部門別に正確に集計される", () => {
    // テストデータ準備：3つの部門に属する部員10名
    const sales_dept_members = [
      {
        user_id: "ENG001",
        user_name: "田中太郎",
        department_id: "DEPT_SALES",
        department_name: "営業部",
      },
      {
        user_id: "ENG002",
        user_name: "佐藤花子",
        department_id: "DEPT_SALES",
        department_name: "営業部",
      },
      {
        user_id: "ENG003",
        user_name: "鈴木一郎",
        department_id: "DEPT_SALES",
        department_name: "営業部",
      },
      {
        user_id: "ENG004",
        user_name: "高橋次郎",
        department_id: "DEPT_SALES",
        department_name: "営業部",
      },
    ];

    const planning_dept_members = [
      {
        user_id: "ENG005",
        user_name: "渡辺美咲",
        department_id: "DEPT_PLANNING",
        department_name: "企画部",
      },
      {
        user_id: "ENG006",
        user_name: "伊藤健太",
        department_id: "DEPT_PLANNING",
        department_name: "企画部",
      },
      {
        user_id: "ENG007",
        user_name: "中村由紀",
        department_id: "DEPT_PLANNING",
        department_name: "企画部",
      },
    ];

    const tech_dept_members = [
      {
        user_id: "ENG008",
        user_name: "山本拓也",
        department_id: "DEPT_TECH",
        department_name: "技術部",
      },
      {
        user_id: "ENG009",
        user_name: "林美優",
        department_id: "DEPT_TECH",
        department_name: "技術部",
      },
      {
        user_id: "ENG010",
        user_name: "木村智彦",
        department_id: "DEPT_TECH",
        department_name: "技術部",
      },
    ];

    const all_members = [
      ...sales_dept_members,
      ...planning_dept_members,
      ...tech_dept_members,
    ];

    // 報告データの準備：全10名の報告データをシステムに登録・送信状態にセット
    const reports = [
      {
        report_id: "REP001",
        user_id: "ENG001",
        yesterday_achievement: "顧客A社との商談完了",
        today_plan: "顧客B社訪問",
        current_issues: "提案資料の修正対応中",
        submitted_at: new Date("2024-01-15T08:30:00Z"),
        submission_status: "submitted",
        department_id: "DEPT_SALES",
      },
      {
        report_id: "REP002",
        user_id: "ENG002",
        yesterday_achievement: "営業資料の作成",
        today_plan: "新規顧客リスト作成",
        current_issues: "顧客データベースのエラー",
        submitted_at: new Date("2024-01-15T08:45:00Z"),
        submission_status: "submitted",
        department_id: "DEPT_SALES",
      },
      {
        report_id: "REP003",
        user_id: "ENG003",
        yesterday_achievement: "既存顧客フォローアップ",
        today_plan: "営業会議出席",
        current_issues: "見積依頼の遅延",
        submitted_at: new Date("2024-01-15T08:15:00Z"),
        submission_status: "submitted",
        department_id: "DEPT_SALES",
      },
      {
        report_id: "REP004",
        user_id: "ENG004",
        yesterday_achievement: "受注報告書作成",
        today_plan: "請求手続き進捗確認",
        current_issues: "特になし",
        submitted_at: new Date("2024-01-15T08:50:00Z"),
        submission_status: "submitted",
        department_id: "DEPT_SALES",
      },
      {
        report_id: "REP005",
        user_id: "ENG005",
        yesterday_achievement: "Q1マーケティング計画策定",
        today_plan: "キャンペーン企画会議",
        current_issues: "予算調整が未定",
        submitted_at: new Date("2024-01-15T09:00:00Z"),
        submission_status: "submitted",
        department_id: "DEPT_PLANNING",
      },
      {
        report_id: "REP006",
        user_id: "ENG006",
        yesterday_achievement: "ブランド戦略レビュー完了",
        today_plan: "デザイン案の評価",
        current_issues: "外部パートナー連絡待ち",
        submitted_at: new Date("2024-01-15T09:10:00Z"),
        submission_status: "submitted",
        department_id: "DEPT_PLANNING",
      },
      {
        report_id: "REP007",
        user_id: "ENG007",
        yesterday_achievement: "市場調査データ分析",
        today_plan: "分析結果プレゼンテーション準備",
        current_issues: "データ欠落1件あり",
        submitted_at: new Date("2024-01-15T09:20:00Z"),
        submission_status: "submitted",
        department_id: "DEPT_PLANNING",
      },
      {
        report_id: "REP008",
        user_id: "ENG008",
        yesterday_achievement: "バックエンドAPI実装",
        today_plan: "ユニットテスト作成",
        current_issues: "データベース接続エラー",
        submitted_at: new Date("2024-01-15T08:40:00Z"),
        submission_status: "submitted",
        department_id: "DEPT_TECH",
      },
      {
        report_id: "REP009",
        user_id: "ENG009",
        yesterday_achievement: "フロントエンド画面実装",
        today_plan: "バグ修正とリファクタリング",
        current_issues: "ブラウザ互換性問題",
        submitted_at: new Date("2024-01-15T08:55:00Z"),
        submission_status: "submitted",
        department_id: "DEPT_TECH",
      },
      {
        report_id: "REP010",
        user_id: "ENG010",
        yesterday_achievement: "インフラ構築完了",
        today_plan: "セキュリティ監査実施",
        current_issues: "SSL証明書更新必要",
        submitted_at: new Date("2024-01-15T09:05:00Z"),
        submission_status: "submitted",
        department_id: "DEPT_TECH",
      },
    ];

    // 報告到着状況把握機能の集計処理を実行
    const aggregation_input = {
      all_members: all_members,
      reports: reports,
      expected_submission_deadline: new Date("2024-01-15T09:30:00Z"),
    };

    const result = aggregateReportsByDepartment(aggregation_input);

    // 期待結果の検証：部門別の集計結果が正確であることを確認
    // 営業部の集計結果検証
    const sales_result = result.department_summaries.find(
      (d) => d.department_id === "DEPT_SALES"
    );
    expect(sales_result).toBeDefined();
    expect(sales_result!.department_name).toBe("営業部");
    expect(sales_result!.total_members).toBe(4);
    expect(sales_result!.submitted_count).toBe(4);
    expect(sales_result!.submission_rate).toBe(1.0);
    expect(sales_result!.submitted_reports).toHaveLength(4);
    expect(
      sales_result!.submitted_reports.map((r) => r.user_id).sort()
    ).toEqual(["ENG001", "ENG002", "ENG003", "ENG004"]);

    // 企画部の集計結果検証
    const planning_result = result.department_summaries.find(
      (d) => d.department_id === "DEPT_PLANNING"
    );
    expect(planning_result).toBeDefined();
    expect(planning_result!.department_name).toBe("企画部");
    expect(planning_result!.total_members).toBe(3);
    expect(planning_result!.submitted_count).toBe(3);
    expect(planning_result!.submission_rate).toBe(1.0);
    expect(planning_result!.submitted_reports).toHaveLength(3);
    expect(
      planning_result!.submitted_reports.map((r) => r.user_id).sort()
    ).toEqual(["ENG005", "ENG006", "ENG007"]);

    // 技術部の集計結果検証
    const tech_result = result.department_summaries.find(
      (d) => d.department_id === "DEPT_TECH"
    );
    expect(tech_result).toBeDefined();
    expect(tech_result!.department_name).toBe("技術部");
    expect(tech_result!.total_members).toBe(3);
    expect(tech_result!.submitted_count).toBe(3);
    expect(tech_result!.submission_rate).toBe(1.0);
    expect(tech_result!.submitted_reports).toHaveLength(3);
    expect(tech_result!.submitted_reports.map((r) => r.user_id).sort()).toEqual(
      ["ENG008", "ENG009", "ENG010"]
    );

    // 全体統計の検証
    expect(result.total_expected_members).toBe(10);
    expect(result.total_submitted_reports).toBe(10);
    expect(result.overall_submission_rate).toBe(1.0);
    expect(result.department_summaries).toHaveLength(3);

    // 重複のないことを検証
    const all_submitted_user_ids = result.department_summaries
      .flatMap((d) => d.submitted_reports)
      .map((r) => r.user_id);
    const unique_user_ids = new Set(all_submitted_user_ids);
    expect(unique_user_ids.size).toBe(10);
  });
});