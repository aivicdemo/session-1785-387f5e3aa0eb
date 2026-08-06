import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx4Imp1Agent } from "../../src/logic/it-1";

describe("日報収集から課題抽出・優先度判定までの自動実行 AIエージェント", () => {
  let fakeAiClient: any;
  let reportStorageStub: any;
  let emailSendStub: any;

  beforeEach(() => {
    // Fake AI Client の初期化
    fakeAiClient = {
      executePrompt: jest.fn(),
      promptExecutionLog: [] as any[],
    };

    // 日報ストレージスタブの初期化
    reportStorageStub = {
      reports: [
        {
          user_id: "user_001",
          user_name: "エンジニアA",
          department: "開発部",
          submitted_at: new Date("2024-01-15T08:30:00Z"),
          yesterday_result: "APIエンドポイント実装完了",
          today_plan: "ユニットテスト作成",
          issues: "テスト環境構築に時間を要している",
        },
        {
          user_id: "user_002",
          user_name: "エンジニアB",
          department: "開発部",
          submitted_at: new Date("2024-01-15T08:45:00Z"),
          yesterday_result: "データベーススキーマ設計完了",
          today_plan: "マイグレーション実装",
          issues: "スキーマ設計承認待ち",
        },
        {
          user_id: "user_003",
          user_name: "エンジニアC",
          department: "開発部",
          submitted_at: new Date("2024-01-15T09:00:00Z"),
          yesterday_result: "フロントエンド コンポーネント設計完了",
          today_plan: "ステートマネジメント実装",
          issues: "デザイン仕様が確定していない",
        },
        {
          user_id: "user_004",
          user_name: "エンジニアD",
          department: "開発部",
          submitted_at: new Date("2024-01-15T09:15:00Z"),
          yesterday_result: "CI/CDパイプライン構築",
          today_plan: "デプロイ自動化設定",
          issues: "レジストリ認証情報設定に時間がかかっている",
        },
        {
          user_id: "user_005",
          user_name: "エンジニアE",
          department: "開発部",
          submitted_at: new Date("2024-01-15T09:30:00Z"),
          yesterday_result: "ドキュメント作成",
          today_plan: "レビュー対応",
          issues: "レビュアーのスケジュール調整が必要",
        },
      ],
      getSubmittedReports: jest.fn(function () {
        return this.reports;
      }),
      getUnsubmittedUserIds: jest.fn(function () {
        const all_user_ids = [
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
        const submitted_user_ids = this.reports.map((r: any) => r.user_id);
        return all_user_ids.filter(
          (id: string) => !submitted_user_ids.includes(id)
        );
      }),
    };

    // メール送信スタブの初期化
    emailSendStub = {
      sentEmails: [] as any[],
      sendEmail: jest.fn(function (to: string, subject: string, body: any) {
        this.sentEmails.push({ to, subject, body, sent_at: new Date() });
        return Promise.resolve({ success: true });
      }),
      getSentCount: jest.fn(function () {
        return this.sentEmails.length;
      }),
    };

    // Fake AI Client が「全体進捗状況を集約・整理する」プロンプトを実行した場合の応答を設定
    fakeAiClient.executePrompt.mockImplementation(
      (prompt_name: string, context: any) => {
        if (prompt_name === "aggregate_progress_status") {
          fakeAiClient.promptExecutionLog.push({
            prompt_name,
            context,
            executed_at: new Date("2024-01-15T09:45:00Z"),
          });

          return Promise.resolve({
            progress_summary: {
              submitted_count: 5,
              unsubmitted_count: 5,
              submission_rate_percent: 50,
            },
            team_yesterday_results: [
              "APIエンドポイント実装完了",
              "データベーススキーマ設計完了",
              "フロントエンド コンポーネント設計完了",
              "CI/CDパイプライン構築",
              "ドキュメント作成",
            ],
            team_today_plans: [
              "ユニットテスト作成",
              "マイグレーション実装",
              "ステートマネジメント実装",
              "デプロイ自動化設定",
              "レビュー対応",
            ],
            common_issues_candidates: [
              {
                issue_text: "スキーマ設計/レビュー関連の承認待ち",
                frequency: 2,
                severity: "high",
              },
              {
                issue_text: "外部依存情報（デザイン仕様、認証設定）の確定遅延",
                frequency: 2,
                severity: "high",
              },
              {
                issue_text: "環境構築・設定作業の時間超過",
                frequency: 1,
                severity: "medium",
              },
            ],
          });
        }

        return Promise.reject(new Error("Unknown prompt: " + prompt_name));
      }
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-572
  test("should execute autonomous action to aggregate progress status and return organized report to director with notification email", async () => {
    // テスト初期化: Fake AI Client、日報ストレージスタブ、メール送信スタブを用意する
    const agent_context = {
      ai_client: fakeAiClient,
      report_storage: reportStorageStub,
      email_sender: emailSendStub,
      director_email: "director@company.com",
      execution_time: new Date("2024-01-15T09:45:00Z"),
    };

    // runTx4Imp1Agent関数を呼び出してAIエージェントを起動する
    const result = await runTx4Imp1Agent(agent_context);

    // Fake AI Clientが日報ストレージスタブから日報5件を読み込んだことを確認する
    const submitted_reports = reportStorageStub.getSubmittedReports();
    expect(submitted_reports).toHaveLength(5);

    // Fake AI Clientが『全体進捗状況を集約・整理する』というプロンプト実行を記録し、集約結果オブジェクトを返すことを確認する
    expect(fakeAiClient.promptExecutionLog).toHaveLength(1);
    expect(fakeAiClient.promptExecutionLog[0].prompt_name).toBe(
      "aggregate_progress_status"
    );

    // 返却されたオブジェクトの進捗サマリーが『提出済み日報5件、未提出5件』と正確に記録されていることを確認する
    expect(result.aggregation.progress_summary.submitted_count).toBe(5);
    expect(result.aggregation.progress_summary.unsubmitted_count).toBe(5);
    expect(result.aggregation.progress_summary.submission_rate_percent).toBe(50);

    // 返却されたオブジェクトの共通課題候補リストが最低1件以上含まれていることを確認する
    expect(result.aggregation.common_issues_candidates).toHaveLength(3);
    expect(result.aggregation.common_issues_candidates[0].issue_text).toMatch(
      /承認待ち/
    );

    // エージェント完了時に整理済みレポート（進捗データ集約結果＋課題優先度リスト）が部長向けの提示オブジェクトとして戻り値に含まれていることを確認する
    expect(result.organized_report).toBeDefined();
    expect(result.organized_report).toHaveProperty("progress_data");
    expect(result.organized_report).toHaveProperty("priority_issue_list");
    expect(result.organized_report.progress_data.submitted_count).toBe(5);
    expect(result.organized_report.progress_data.unsubmitted_count).toBe(5);
    expect(result.organized_report.priority_issue_list).toHaveLength(3);

    // メール送信スタブの呼び出し履歴を確認し、部長宛のレポート通知メールが1件送信されていることを確認する
    expect(emailSendStub.getSentCount()).toBe(1);
    expect(emailSendStub.sentEmails[0].to).toBe("director@company.com");
    expect(emailSendStub.sentEmails[0].subject).toMatch(/進捗レポート/);
    expect(emailSendStub.sentEmails[0].body).toHaveProperty(
      "submitted_count",
      5
    );
    expect(emailSendStub.sentEmails[0].body).toHaveProperty(
      "unsubmitted_count",
      5
    );
  });
});