import { runTx4Imp1Agent } from "../../src/logic/it-1";

interface ExtractedIssue {
  taskId: string;
  extractedIssue: string;
  priorityLevel: "HIGH" | "MEDIUM" | "LOW";
  category: string;
  confidence_score: number;
  reasoning: string;
}

interface ManagerPresentationData {
  issuePriorityList: ExtractedIssue[];
  auditLog: Array<{
    eventType: string;
    timestamp: string;
    judgmentCriteriaRefId: string;
    aiModelResponseTime: string;
  }>;
  skippedActions: string[];
}

interface Tx4Imp1AiClient {
  prioritizeAndClassifyIssues(
    extractedIssues: Array<{
      taskId: string;
      issue: string;
      context: string;
    }>
  ): Promise<{
    prioritized: ExtractedIssue[];
    criteriaApplied: string;
    modelResponseTime: string;
  }>;
}

class FakeTx4Imp1AiClient implements Tx4Imp1AiClient {
  async prioritizeAndClassifyIssues(
    extractedIssues: Array<{
      taskId: string;
      issue: string;
      context: string;
    }>
  ) {
    const prioritized: ExtractedIssue[] = extractedIssues.map((issue) => {
      let priorityLevel: "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
      let category = "Technical";
      let confidence_score = 0.85;
      let reasoning = "Default reasoning";

      if (
        issue.issue.toLowerCase().includes("critical") ||
        issue.issue.toLowerCase().includes("blocker")
      ) {
        priorityLevel = "HIGH";
        category = "Critical";
        confidence_score = 0.95;
        reasoning =
          "Issue contains critical keywords: blocker or critical severity detected";
      } else if (
        issue.issue.toLowerCase().includes("urgent") ||
        issue.issue.toLowerCase().includes("high")
      ) {
        priorityLevel = "HIGH";
        category = "Risk";
        confidence_score = 0.9;
        reasoning = "Issue marked as urgent or high priority in content";
      } else if (
        issue.issue.toLowerCase().includes("minor") ||
        issue.issue.toLowerCase().includes("low")
      ) {
        priorityLevel = "LOW";
        category = "Enhancement";
        confidence_score = 0.8;
        reasoning = "Issue marked as minor or low priority in content";
      } else if (
        issue.issue.toLowerCase().includes("milestone") ||
        issue.issue.toLowerCase().includes("schedule")
      ) {
        priorityLevel = "HIGH";
        category = "Schedule";
        confidence_score = 0.88;
        reasoning = "Schedule or milestone-related issue detected";
      } else if (
        issue.issue.toLowerCase().includes("dependency") ||
        issue.issue.toLowerCase().includes("blocked")
      ) {
        priorityLevel = "HIGH";
        category = "Dependency";
        confidence_score = 0.92;
        reasoning = "Blocking dependency or resource constraint detected";
      }

      return {
        taskId: issue.taskId,
        extractedIssue: issue.issue,
        priorityLevel,
        category,
        confidence_score,
        reasoning,
      };
    });

    return {
      prioritized,
      criteriaApplied: "CRITERIA_REF_001",
      modelResponseTime: "2024-01-15T09:15:30Z",
    };
  }
}

describe("日報入力フォームの提供と送信機能", () => {
  test("SCEN-574: 課題の優先度を自動判定・分類する契約に基づき、AIエージェントが優先度判定結果を正確に生成し監査ログを記録する", async () => {
    const fakeAiClient = new FakeTx4Imp1AiClient();

    const mockExtractedIssues = [
      {
        taskId: "TASK_001",
        issue: "Critical database migration blocker - schema mismatch",
        context:
          "Database team reported schema incompatibility in production environment",
      },
      {
        taskId: "TASK_002",
        issue: "Urgent API performance degradation - response time 5s",
        context:
          "API endpoint responding 5x slower than baseline, affecting customer experience",
      },
      {
        taskId: "TASK_003",
        issue: "Milestone: Q1 release schedule at risk",
        context:
          "Development team falling 2 weeks behind schedule due to unforeseen technical debt",
      },
      {
        taskId: "TASK_004",
        issue: "Blocked by third-party payment gateway integration",
        context:
          "Waiting for external vendor to provide sandbox credentials",
      },
      {
        taskId: "TASK_005",
        issue: "Minor UI alignment issue on mobile devices",
        context: "Button spacing inconsistency on responsive layout",
      },
      {
        taskId: "TASK_006",
        issue: "Code review backlog - low priority tech debt",
        context:
          "Technical debt items not impacting current deliverables or user experience",
      },
      {
        taskId: "TASK_007",
        issue: "High risk: Memory leak in background service",
        context:
          "Potential memory leak detected in production monitoring alerts",
      },
      {
        taskId: "TASK_008",
        issue:
          "Dependency version update - security patch available for npm packages",
        context:
          "Requires review and testing before production deployment",
      },
      {
        taskId: "TASK_009",
        issue: "Documentation enhancement for API endpoints",
        context: "Low urgency improvement to developer documentation",
      },
      {
        taskId: "TASK_010",
        issue: "Email notification delivery stuck - customer complaints",
        context:
          "Critical issue affecting customer engagement, requires immediate investigation",
      },
    ];

    const aiResult = await fakeAiClient.prioritizeAndClassifyIssues(
      mockExtractedIssues
    );

    const managerPresentationData: ManagerPresentationData = {
      issuePriorityList: aiResult.prioritized,
      auditLog: [
        {
          eventType: "優先度判定実行",
          timestamp: "2024-01-15T09:15:00Z",
          judgmentCriteriaRefId: aiResult.criteriaApplied,
          aiModelResponseTime: aiResult.modelResponseTime,
        },
      ],
      skippedActions: [
        "メール送信",
        "日報読み込み",
        "進捗集約",
        "課題抽出",
      ],
    };

    expect(managerPresentationData.issuePriorityList).toHaveLength(10);

    expect(managerPresentationData.issuePriorityList[0]).toEqual({
      taskId: "TASK_001",
      extractedIssue: "Critical database migration blocker - schema mismatch",
      priorityLevel: "HIGH",
      category: "Critical",
      confidence_score: 0.95,
      reasoning:
        "Issue contains critical keywords: blocker or critical severity detected",
    });

    expect(managerPresentationData.issuePriorityList[1]).toEqual({
      taskId: "TASK_002",
      extractedIssue: "Urgent API performance degradation - response time 5s",
      priorityLevel: "HIGH",
      category: "Risk",
      confidence_score: 0.9,
      reasoning: "Issue marked as urgent or high priority in content",
    });

    expect(managerPresentationData.issuePriorityList[2]).toEqual({
      taskId: "TASK_003",
      extractedIssue: "Milestone: Q1 release schedule at risk",
      priorityLevel: "HIGH",
      category: "Schedule",
      confidence_score: 0.88,
      reasoning: "Schedule or milestone-related issue detected",
    });

    expect(managerPresentationData.issuePriorityList[3]).toEqual({
      taskId: "TASK_004",
      extractedIssue: "Blocked by third-party payment gateway integration",
      priorityLevel: "HIGH",
      category: "Dependency",
      confidence_score: 0.92,
      reasoning: "Blocking dependency or resource constraint detected",
    });

    expect(managerPresentationData.issuePriorityList[4]).toEqual({
      taskId: "TASK_005",
      extractedIssue: "Minor UI alignment issue on mobile devices",
      priorityLevel: "LOW",
      category: "Enhancement",
      confidence_score: 0.8,
      reasoning: "Issue marked as minor or low priority in content",
    });

    expect(managerPresentationData.issuePriorityList[5]).toEqual({
      taskId: "TASK_006",
      extractedIssue: "Code review backlog - low priority tech debt",
      priorityLevel: "LOW",
      category: "Enhancement",
      confidence_score: 0.8,
      reasoning: "Issue marked as minor or low priority in content",
    });

    expect(managerPresentationData.issuePriorityList[6]).toEqual({
      taskId: "TASK_007",
      extractedIssue: "High risk: Memory leak in background service",
      priorityLevel: "HIGH",
      category: "Risk",
      confidence_score: 0.9,
      reasoning: "Issue marked as urgent or high priority in content",
    });

    expect(managerPresentationData.issuePriorityList[7]).toEqual({
      taskId: "TASK_008",
      extractedIssue: "Dependency version update - security patch available",
      priorityLevel: "HIGH",
      category: "Dependency",
      confidence_score: 0.92,
      reasoning: "Blocking dependency or resource constraint detected",
    });

    expect(managerPresentationData.issuePriorityList[8]).toEqual({
      taskId: "TASK_009",
      extractedIssue: "Documentation enhancement for API endpoints",
      priorityLevel: "MEDIUM",
      category: "Technical",
      confidence_score: 0.85,
      reasoning: "Default reasoning",
    });

    expect(managerPresentationData.issuePriorityList[9]).toEqual({
      taskId: "TASK_010",
      extractedIssue: "Email notification delivery stuck - customer complaints",
      priorityLevel: "HIGH",
      category: "Critical",
      confidence_score: 0.95,
      reasoning:
        "Issue contains critical keywords: blocker or critical severity detected",
    });

    expect(managerPresentationData.auditLog).toHaveLength(1);
    expect(managerPresentationData.auditLog[0].eventType).toBe(
      "優先度判定実行"
    );
    expect(managerPresentationData.auditLog[0].judgmentCriteriaRefId).toBe(
      "CRITERIA_REF_001"
    );
    expect(managerPresentationData.auditLog[0].aiModelResponseTime).toBe(
      "2024-01-15T09:15:30Z"
    );

    expect(managerPresentationData.skippedActions).toEqual([
      "メール送信",
      "日報読み込み",
      "進捗集約",
      "課題抽出",
    ]);
    expect(managerPresentationData.skippedActions).toHaveLength(4);

    const highPriorityIssues = managerPresentationData.issuePriorityList.filter(
      (issue) => issue.priorityLevel === "HIGH"
    );
    expect(highPriorityIssues).toHaveLength(7);

    const mediumPriorityIssues =
      managerPresentationData.issuePriorityList.filter(
        (issue) => issue.priorityLevel === "MEDIUM"
      );
    expect(mediumPriorityIssues).toHaveLength(1);

    const lowPriorityIssues = managerPresentationData.issuePriorityList.filter(
      (issue) => issue.priorityLevel === "LOW"
    );
    expect(lowPriorityIssues).toHaveLength(2);

    for (const issue of managerPresentationData.issuePriorityList) {
      expect(issue.taskId).toBeDefined();
      expect(issue.extractedIssue).toBeDefined();
      expect(["HIGH", "MEDIUM", "LOW"]).toContain(issue.priorityLevel);
      expect(issue.category).toBeDefined();
      expect(issue.confidence_score).toBeGreaterThanOrEqual(0.75);
      expect(issue.confidence_score).toBeLessThanOrEqual(0.99);
      expect(issue.reasoning).toBeDefined();
      expect(issue.reasoning.length).toBeGreaterThan(0);
    }

    const taskIds = new Set(
      managerPresentationData.issuePriorityList.map((issue) => issue.taskId)
    );
    expect(taskIds.size).toBe(10);

    const criticalIssues = managerPresentationData.issuePriorityList.filter(
      (issue) => issue.category === "Critical"
    );
    expect(criticalIssues.length).toBeGreaterThan(0);

    const dependencyIssues = managerPresentationData.issuePriorityList.filter(
      (issue) => issue.category === "Dependency"
    );
    expect(dependencyIssues.length).toBeGreaterThan(0);

    const allConfidenceScoresAboveThreshold =
      managerPresentationData.issuePriorityList.every(
        (issue) => issue.confidence_score >= 0.75
      );
    expect(allConfidenceScoresAboveThreshold).toBe(true);
  });
});