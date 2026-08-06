import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import type { User } from "../../src/logic/it-1";
import type { MorningReport } from "../../src/logic/it-1";
import type { ReportSubmissionHistory } from "../../src/logic/it-1";
import {
  aggregateReportsInUnifiedFormat,
  sendAggregatedReportEmail,
} from "../../src/logic/it-1";

interface MockEmailService {
  sendEmail: jest.Mock<
    Promise<{ success: boolean; messageId: string }>,
    [{ to: string; subject: string; body: string }]
  >;
}

interface MockReportRepository {
  getSubmittedReports: jest.Mock<
    Promise<
      Array<{
        userId: string;
        userName: string;
        yesterdayAccomplishment: string;
        todayPlan: string;
        currentIssue: string;
        submittedAt: Date;
      }>
    >,
    []
  >;
}

describe("日報入力フォームの提供と送信機能", () => {
  let mockEmailService: MockEmailService;
  let mockReportRepository: MockReportRepository;

  const departmentHeadUserId = "mgr-001";
  const reportSubmissionDeadline = new Date("2024-01-15T08:00:00Z");
  const meetingStartTime = new Date("2024-01-15T09:00:00Z");

  beforeEach(() => {
    mockEmailService = {
      sendEmail: jest.fn(async (params) => ({
        success: true,
        messageId: `msg-${Date.now()}`,
      })),
    };

    mockReportRepository = {
      getSubmittedReports: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-278: [normal] 確認メール配信・日報一覧集約機能 - 送信済み部員10名の日報が統一フォーマットで一覧集約されてメールに含まれる
  test("should aggregate 10 submitted reports in unified format and include them in confirmation email", async () => {
    const submittedReportsData = [
      {
        userId: "emp-001",
        userName: "田中太郎",
        yesterdayAccomplishment: "機能A の実装完了",
        todayPlan: "機能B の設計実施",
        currentIssue: "フレームワーク選定で迷っている",
        submittedAt: new Date("2024-01-15T07:30:00Z"),
      },
      {
        userId: "emp-002",
        userName: "田中花子",
        yesterdayAccomplishment: "テストコード作成",
        todayPlan: "CI/CD パイプライン構築",
        currentIssue: "デプロイスクリプトのバグ対応中",
        submittedAt: new Date("2024-01-15T07:35:00Z"),
      },
      {
        userId: "emp-003",
        userName: "佐藤次郎",
        yesterdayAccomplishment: "DB スキーマ設計",
        todayPlan: "マイグレーション実行",
        currentIssue: "パフォーマンス問題の調査",
        submittedAt: new Date("2024-01-15T07:40:00Z"),
      },
      {
        userId: "emp-004",
        userName: "佐藤美咲",
        yesterdayAccomplishment: "API 仕様書作成",
        todayPlan: "フロントエンド実装開始",
        currentIssue: "API レスポンス設計の合意待ち",
        submittedAt: new Date("2024-01-15T07:25:00Z"),
      },
      {
        userId: "emp-005",
        userName: "鈴木健一",
        yesterdayAccomplishment: "セキュリティ脆弱性スキャン実施",
        todayPlan: "脆弱性の修正対応",
        currentIssue: "外部ライブラリのアップデート待ち",
        submittedAt: new Date("2024-01-15T07:45:00Z"),
      },
      {
        userId: "emp-006",
        userName: "鈴木由美",
        yesterdayAccomplishment: "要件定義ドキュメント確認",
        todayPlan: "ユーザーテスト実施",
        currentIssue: "テスト環境の構築が遅延中",
        submittedAt: new Date("2024-01-15T07:50:00Z"),
      },
      {
        userId: "emp-007",
        userName: "山田太郎",
        yesterdayAccomplishment: "バグフィックス 5 件対応",
        todayPlan: "コードレビュー実施",
        currentIssue: "QA からの差し戻し件数が増加",
        submittedAt: new Date("2024-01-15T07:20:00Z"),
      },
      {
        userId: "emp-008",
        userName: "山田春奈",
        yesterdayAccomplishment: "ドキュメント更新",
        todayPlan: "研修資料作成",
        currentIssue: "チーム内の知識共有がまだ不十分",
        submittedAt: new Date("2024-01-15T07:55:00Z"),
      },
      {
        userId: "emp-009",
        userName: "高橋次郎",
        yesterdayAccomplishment: "インフラ構築作業",
        todayPlan: "モニタリング設定",
        currentIssue: "クラウドコスト最適化が課題",
        submittedAt: new Date("2024-01-15T07:15:00Z"),
      },
      {
        userId: "emp-010",
        userName: "高橋絵美",
        yesterdayAccomplishment: "プロジェクト計画立案",
        todayPlan: "リスク分析実施",
        currentIssue: "リソース不足のため調整中",
        submittedAt: new Date("2024-01-15T08:00:00Z"),
      },
    ];

    mockReportRepository.getSubmittedReports.mockResolvedValueOnce(
      submittedReportsData
    );

    const aggregatedResult = await aggregateReportsInUnifiedFormat(
      mockReportRepository
    );

    expect(aggregatedResult).toBeDefined();
    expect(aggregatedResult.reports).toHaveLength(10);

    const expectedFormattedReports = [
      "田中太郎 | 機能A の実装完了 | 機能B の設計実施 | フレームワーク選定で迷っている",
      "田中花子 | テストコード作成 | CI/CD パイプライン構築 | デプロイスクリプトのバグ対応中",
      "佐藤次郎 | DB スキーマ設計 | マイグレーション実行 | パフォーマンス問題の調査",
      "佐藤美咲 | API 仕様書作成 | フロントエンド実装開始 | API レスポンス設計の合意待ち",
      "鈴木健一 | セキュリティ脆弱性スキャン実施 | 脆弱性の修正対応 | 外部ライブラリのアップデート待ち",
      "鈴木由美 | 要件定義ドキュメント確認 | ユーザーテスト実施 | テスト環境の構築が遅延中",
      "山田太郎 | バグフィックス 5 件対応 | コードレビュー実施 | QA からの差し戻し件数が増加",
      "山田春奈 | ドキュメント更新 | 研修資料作成 | チーム内の知識共有がまだ不十分",
      "高橋次郎 | インフラ構築作業 | モニタリング設定 | クラウドコスト最適化が課題",
      "高橋絵美 | プロジェクト計画立案 | リスク分析実施 | リソース不足のため調整中",
    ];

    aggregatedResult.reports.forEach((report, index) => {
      expect(report).toEqual(expectedFormattedReports[index]);
    });

    const sendEmailParams = {
      to: departmentHeadUserId,
      subject: "【朝会日報】送信済み確認メール（本日 2024-01-15）",
      body: `朝会開始時刻: 2024-01-15T09:00:00Z\n送信状況確認: 全 10 名から報告を受け取りました\n\n【統一フォーマット日報一覧】\n部員名 | 昨日やったこと | 今日やること | 抱えている課題\n${expectedFormattedReports.join("\n")}`,
    };

    await sendAggregatedReportEmail(mockEmailService, sendEmailParams);

    expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1);
    expect(mockEmailService.sendEmail).toHaveBeenCalledWith({
      to: departmentHeadUserId,
      subject: expect.stringContaining("朝会日報"),
      body: expect.stringContaining("田中太郎"),
    });

    const emailCall = mockEmailService.sendEmail.mock.calls[0][0];
    expect(emailCall.body).toContain("機能A の実装完了");
    expect(emailCall.body).toContain("テストコード作成");
    expect(emailCall.body).toContain("DB スキーマ設計");
    expect(emailCall.body).toContain("API 仕様書作成");
    expect(emailCall.body).toContain(
      "セキュリティ脆弱性スキャン実施"
    );
    expect(emailCall.body).toContain("要件定義ドキュメント確認");
    expect(emailCall.body).toContain("バグフィックス 5 件対応");
    expect(emailCall.body).toContain("ドキュメント更新");
    expect(emailCall.body).toContain("インフラ構築作業");
    expect(emailCall.body).toContain("プロジェクト計画立案");

    const lineCount = emailCall.body.split("\n").length;
    expect(lineCount).toBeGreaterThanOrEqual(10);

    expect(emailCall.body).toContain("昨日やったこと");
    expect(emailCall.body).toContain("今日やること");
    expect(emailCall.body).toContain("抱えている課題");
  });
});