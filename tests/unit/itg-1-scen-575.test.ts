import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx4Imp1Agent } from "../../src/logic/it-1";

interface DailyReport {
  userId: string;
  userName: string;
  yesterday: string;
  today: string;
  challenges: string;
  submittedAt: string;
}

interface PrioritizedIssue {
  priority: "high" | "medium" | "low";
  content: string;
  reasoning: string;
}

interface ExecutiveReport {
  progressStatus: {
    todayPlan: number;
    yesterdayResult: number;
    progressRate: number;
  };
  issues: {
    high: PrioritizedIssue[];
    medium: PrioritizedIssue[];
    low: PrioritizedIssue[];
  };
  totalIssuesExtracted: number;
  nonTargetIssues: number;
  reportSubmittedBy: number;
  presentedAt: string;
}

interface Tx4Imp1AiClient {
  sendConfirmationEmail(recipients: string[]): Promise<{ status: string }>;
  readAllDailyReports(
    reports: DailyReport[]
  ): Promise<{ status: string; count: number }>;
  aggregateProgressStatus(
    reports: DailyReport[]
  ): Promise<{ status: string; aggregated: boolean }>;
  extractIssuesAndBottlenecks(
    reports: DailyReport[]
  ): Promise<{
    status: string;
    issues: Array<{ content: string; source: string }>;
  }>;
  prioritizeIssues(
    issues: Array<{ content: string; source: string }>
  ): Promise<{
    high: Array<{ content: string; reasoning: string }>;
    medium: Array<{ content: string; reasoning: string }>;
    low: Array<{ content: string; reasoning: string }>;
    totalExtracted: number;
    nonTarget: number;
  }>;
}

describe("日報収集から課題抽出・優先度判定までの自動実行 AIエージェント", () => {
  let mockAiClient: Tx4Imp1AiClient;

  beforeEach(() => {
    mockAiClient = {
      sendConfirmationEmail: jest.fn().mockResolvedValue({ status: "sent" }),
      readAllDailyReports: jest
        .fn()
        .mockResolvedValue({ status: "read", count: 10 }),
      aggregateProgressStatus: jest
        .fn()
        .mockResolvedValue({ status: "aggregated", aggregated: true }),
      extractIssuesAndBottlenecks: jest.fn().mockResolvedValue({
        status: "extracted",
        issues: [
          {
            content: "Database connection timeout",
            source: "user_001",
          },
          {
            content: "API response latency",
            source: "user_002",
          },
          {
            content: "Memory leak in service",
            source: "user_003",
          },
        ],
      }),
      prioritizeIssues: jest.fn().mockResolvedValue({
        high: [
          {
            content: "Memory leak in service",
            reasoning:
              "Critical system stability issue affecting all services",
          },
          {
            content: "Database connection timeout",
            reasoning: "Blocks data operations for multiple teams",
          },
        ],
        medium: [
          {
            content: "API response latency",
            reasoning:
              "Impacts user experience but has workaround available",
          },
        ],
        low: [],
        totalExtracted: 3,
        nonTarget: 0,
      }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-575
  test("should execute autonomous actions in sequence and present structured report to director", async () => {
    const nowTimestamp = new Date("2024-01-15T08:00:00Z").toISOString();
    const systemTime = new Date(nowTimestamp);

    const mockReports: DailyReport[] = [
      {
        userId: "user_001",
        userName: "Engineer A",
        yesterday: "Completed API integration",
        today: "Review pull requests",
        challenges: "Database connection timeout",
        submittedAt: "2024-01-15T07:30:00Z",
      },
      {
        userId: "user_002",
        userName: "Engineer B",
        yesterday: "Fixed critical bug",
        today: "Deploy to staging",
        challenges: "API response latency",
        submittedAt: "2024-01-15T07:25:00Z",
      },
      {
        userId: "user_003",
        userName: "Engineer C",
        yesterday: "Unit tests for module X",
        today: "Documentation update",
        challenges: "Memory leak in service",
        submittedAt: "2024-01-15T07:20:00Z",
      },
      {
        userId: "user_004",
        userName: "Engineer D",
        yesterday: "Code refactoring",
        today: "Performance optimization",
        challenges: "Caching strategy unclear",
        submittedAt: "2024-01-15T07:35:00Z",
      },
      {
        userId: "user_005",
        userName: "Engineer E",
        yesterday: "Dependency upgrade",
        today: "Regression testing",
        challenges: "Compatibility issues",
        submittedAt: "2024-01-15T07:28:00Z",
      },
      {
        userId: "user_006",
        userName: "Engineer F",
        yesterday: "Feature implementation",
        today: "User acceptance testing",
        challenges: "Test data preparation",
        submittedAt: "2024-01-15T07:32:00Z",
      },
      {
        userId: "user_007",
        userName: "Engineer G",
        yesterday: "Security audit",
        today: "Patch deployment",
        challenges: "Downtime scheduling",
        submittedAt: "2024-01-15T07:27:00Z",
      },
      {
        userId: "user_008",
        userName: "Engineer H",
        yesterday: "Infrastructure setup",
        today: "Monitoring configuration",
        challenges: "Alert tuning complexity",
        submittedAt: "2024-01-15T07:33:00Z",
      },
      {
        userId: "user_009",
        userName: "Engineer I",
        yesterday: "Documentation review",
        today: "API specification update",
        challenges: "Versioning inconsistency",
        submittedAt: "2024-01-15T07:31:00Z",
      },
      {
        userId: "user_010",
        userName: "Engineer J",
        yesterday: "Build pipeline optimization",
        today: "CI/CD improvements",
        challenges: "Build time reduction",
        submittedAt: "2024-01-15T07:29:00Z",
      },
    ];

    const result = await runTx4Imp1Agent(mockAiClient, mockReports, systemTime);

    expect(mockAiClient.sendConfirmationEmail).toHaveBeenCalledWith(
      expect.any(Array)
    );
    expect(mockAiClient.readAllDailyReports).toHaveBeenCalledWith(mockReports);
    expect(mockAiClient.aggregateProgressStatus).toHaveBeenCalledWith(
      mockReports
    );
    expect(mockAiClient.extractIssuesAndBottlenecks).toHaveBeenCalledWith(
      mockReports
    );
    expect(mockAiClient.prioritizeIssues).toHaveBeenCalled();

    const report = result as ExecutiveReport;

    expect(report).toHaveProperty("progressStatus");
    expect(report.progressStatus).toHaveProperty("todayPlan");
    expect(report.progressStatus).toHaveProperty("yesterdayResult");
    expect(report.progressStatus).toHaveProperty("progressRate");

    expect(report).toHaveProperty("issues");
    expect(report.issues).toHaveProperty("high");
    expect(report.issues).toHaveProperty("medium");
    expect(report.issues).toHaveProperty("low");

    expect(report.issues.high).toHaveLength(2);
    expect(report.issues.high[0]).toEqual({
      priority: "high",
      content: "Memory leak in service",
      reasoning: "Critical system stability issue affecting all services",
    });
    expect(report.issues.high[1]).toEqual({
      priority: "high",
      content: "Database connection timeout",
      reasoning: "Blocks data operations for multiple teams",
    });

    expect(report.issues.medium).toHaveLength(1);
    expect(report.issues.medium[0]).toEqual({
      priority: "medium",
      content: "API response latency",
      reasoning: "Impacts user experience but has workaround available",
    });

    expect(report.issues.low).toHaveLength(0);

    expect(report.totalIssuesExtracted).toBe(3);
    expect(report.nonTargetIssues).toBe(0);
    expect(report.reportSubmittedBy).toBe(10);

    const presentedTime = new Date(report.presentedAt).getTime();
    const systemTimeMs = systemTime.getTime();
    const timeDiffMs = Math.abs(presentedTime - systemTimeMs);
    expect(timeDiffMs).toBeLessThanOrEqual(5000);

    expect(mockAiClient.sendConfirmationEmail).toHaveBeenCalledTimes(1);
    expect(mockAiClient.readAllDailyReports).toHaveBeenCalledTimes(1);
    expect(mockAiClient.aggregateProgressStatus).toHaveBeenCalledTimes(1);
    expect(mockAiClient.extractIssuesAndBottlenecks).toHaveBeenCalledTimes(1);
    expect(mockAiClient.prioritizeIssues).toHaveBeenCalledTimes(1);
  });
});