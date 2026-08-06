import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import type { Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/ai-client";
import { runTx2Imp1Agent } from "../../src/agents/tx-2-imp-1/orchestrator";

describe("Tx2Imp1Agent - 日報収集から報告漏れ特定までの自動判定と通知", () => {
  let mockAiClient: jest.Mocked<Tx2Imp1AiClient>;
  let mockDb: any;
  let mockEmailService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // モックDBの初期化
    mockDb = {
      users: [
        { user_id: "EMP-001", name: "田中太郎", department: "開発部" },
        { user_id: "EMP-002", name: "鈴木花子", department: "開発部" },
        { user_id: "EMP-003", name: "佐藤次郎", department: "開発部" },
        { user_id: "EMP-004", name: "高橋美咲", department: "開発部" },
        { user_id: "EMP-005", name: "伊藤健一", department: "開発部" },
        { user_id: "EMP-006", name: "渡辺由美", department: "開発部" },
        { user_id: "EMP-007", name: "中村大輔", department: "開発部" },
        { user_id: "EMP-008", name: "小林夏子", department: "開発部" },
        { user_id: "EMP-009", name: "加藤隆一", department: "開発部" },
        { user_id: "EMP-010", name: "松本麻衣", department: "開発部" },
      ],
      reports: [
        {
          report_id: "RPT-001",
          user_id: "EMP-001",
          submitted_at: "2024-01-15T08:30:00Z",
          status: "submitted",
        },
        {
          report_id: "RPT-002",
          user_id: "EMP-002",
          submitted_at: "2024-01-15T08:35:00Z",
          status: "submitted",
        },
        {
          report_id: "RPT-003",
          user_id: "EMP-003",
          submitted_at: "2024-01-15T08:20:00Z",
          status: "submitted",
        },
        {
          report_id: "RPT-004",
          user_id: "EMP-004",
          submitted_at: "2024-01-15T08:40:00Z",
          status: "submitted",
        },
        {
          report_id: "RPT-005",
          user_id: "EMP-005",
          submitted_at: "2024-01-15T08:25:00Z",
          status: "submitted",
        },
        {
          report_id: "RPT-006",
          user_id: "EMP-006",
          submitted_at: "2024-01-15T08:45:00Z",
          status: "submitted",
        },
        {
          report_id: "RPT-008",
          user_id: "EMP-008",
          submitted_at: "2024-01-15T08:50:00Z",
          status: "submitted",
        },
        {
          report_id: "RPT-009",
          user_id: "EMP-009",
          submitted_at: "2024-01-15T08:15:00Z",
          status: "submitted",
        },
        {
          report_id: "RPT-010",
          user_id: "EMP-010",
          submitted_at: "2024-01-15T08:55:00Z",
          status: "submitted",
        },
      ],
    };

    // モックAiClientの実装
    mockAiClient = {
      monitorAndIdentifyUnsubmittedReports: jest.fn(),
    } as any;

    // AIクライアントの戻り値を定義
    mockAiClient.monitorAndIdentifyUnsubmittedReports.mockResolvedValue({
      timestamp: "2024-01-15T09:00:00Z",
      submitted_reports: [
        {
          user_id: "EMP-001",
          name: "田中太郎",
          department: "開発部",
          submitted_at: "2024-01-15T08:30:00Z",
          submitted: true,
        },
        {
          user_id: "EMP-002",
          name: "鈴木花子",
          department: "開発部",
          submitted_at: "2024-01-15T08:35:00Z",
          submitted: true,
        },
        {
          user_id: "EMP-003",
          name: "佐藤次郎",
          department: "開発部",
          submitted_at: "2024-01-15T08:20:00Z",
          submitted: true,
        },
        {
          user_id: "EMP-004",
          name: "高橋美咲",
          department: "開発部",
          submitted_at: "2024-01-15T08:40:00Z",
          submitted: true,
        },
        {
          user_id: "EMP-005",
          name: "伊藤健一",
          department: "開発部",
          submitted_at: "2024-01-15T08:25:00Z",
          submitted: true,
        },
        {
          user_id: "EMP-006",
          name: "渡辺由美",
          department: "開発部",
          submitted_at: "2024-01-15T08:45:00Z",
          submitted: true,
        },
        {
          user_id: "EMP-008",
          name: "小林夏子",
          department: "開発部",
          submitted_at: "2024-01-15T08:50:00Z",
          submitted: true,
        },
        {
          user_id: "EMP-009",
          name: "加藤隆一",
          department: "開発部",
          submitted_at: "2024-01-15T08:15:00Z",
          submitted: true,
        },
        {
          user_id: "EMP-010",
          name: "松本麻衣",
          department: "開発部",
          submitted_at: "2024-01-15T08:55:00Z",
          submitted: true,
        },
      ],
      unsubmitted_reports: [
        {
          user_id: "EMP-007",
          name: "中村大輔",
          department: "開発部",
          submitted: false,
        },
      ],
      total_users: 10,
      submitted_count: 9,
      unsubmitted_count: 1,
    });

    mockEmailService = {
      sendNotificationEmail: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-283
  test("確認メール配信・日報一覧集約機能 - 未送信部員が1名の場合、その部員が未送信リストに表示される", async () => {
    // 実行: runTx2Imp1Agent()を実行
    const result = await runTx2Imp1Agent({
      aiClient: mockAiClient,
      checkTime: new Date("2024-01-15T09:00:00Z"),
      mandatorySubmissionDeadline: new Date("2024-01-15T08:00:00Z"),
      allUsers: mockDb.users,
      submittedReports: mockDb.reports,
    });

    // 検証: AIエージェントが生成した日報一覧集約結果を検証
    expect(result).toBeDefined();
    expect(result.timestamp).toBe("2024-01-15T09:00:00Z");

    // 送信済みリストの検証
    expect(result.submitted_reports).toHaveLength(9);
    expect(result.submitted_reports.map((r: any) => r.user_id)).toEqual([
      "EMP-001",
      "EMP-002",
      "EMP-003",
      "EMP-004",
      "EMP-005",
      "EMP-006",
      "EMP-008",
      "EMP-009",
      "EMP-010",
    ]);

    // 未送信リストの検証
    expect(result.unsubmitted_reports).toHaveLength(1);
    expect(result.unsubmitted_reports[0].user_id).toBe("EMP-007");
    expect(result.unsubmitted_reports[0].name).toBe("中村大輔");
    expect(result.unsubmitted_reports[0].department).toBe("開発部");
    expect(result.unsubmitted_reports[0].submitted).toBe(false);

    // 統計情報の検証
    expect(result.total_users).toBe(10);
    expect(result.submitted_count).toBe(9);
    expect(result.unsubmitted_count).toBe(1);

    // AIクライアントが正しく呼び出されたことを確認
    expect(mockAiClient.monitorAndIdentifyUnsubmittedReports).toHaveBeenCalledTimes(1);
    expect(mockAiClient.monitorAndIdentifyUnsubmittedReports).toHaveBeenCalledWith({
      checkTime: new Date("2024-01-15T09:00:00Z"),
      mandatorySubmissionDeadline: new Date("2024-01-15T08:00:00Z"),
      allUsers: mockDb.users,
      submittedReports: mockDb.reports,
    });
  });
});