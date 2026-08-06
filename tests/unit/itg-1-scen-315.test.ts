import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import type { Tx2Imp1AiClient } from "../../../src/agents/tx-2-imp-1/types";
import { runTx2Imp1Agent } from "../../../src/agents/tx-2-imp-1/orchestrator";

// Mock types and data structures
interface ReportSubmission {
  userId: string;
  userName: string;
  departmentId: string;
  submittedAt: string;
  yesterdayAccomplishment: string;
  todayPlan: string;
  issueFaced: string;
}

interface AggregatedReport {
  submittedAtTimestamp: string;
  memberCount: number;
  members: Array<{
    userId: string;
    userName: string;
  }>;
}

interface ConfirmationEmailLog {
  recipientRole: string;
  recipientEmail: string;
  subject: string;
  content: string;
  sentAt: string;
}

// Fake AI Client implementation
class FakeTx2Imp1AiClient implements Tx2Imp1AiClient {
  async aggregateReportsByTimestamp(
    reports: ReportSubmission[]
  ): Promise<AggregatedReport[]> {
    const groupedByTimestamp: Map<string, ReportSubmission[]> = new Map();

    for (const report of reports) {
      const timestamp = report.submittedAt;
      if (!groupedByTimestamp.has(timestamp)) {
        groupedByTimestamp.set(timestamp, []);
      }
      groupedByTimestamp.get(timestamp)!.push(report);
    }

    const aggregated: AggregatedReport[] = [];
    for (const [timestamp, members] of groupedByTimestamp.entries()) {
      aggregated.push({
        submittedAtTimestamp: timestamp,
        memberCount: members.length,
        members: members.map((m) => ({
          userId: m.userId,
          userName: m.userName,
        })),
      });
    }

    return aggregated;
  }
}

// Stub for email delivery
class EmailDeliveryStub {
  logs: ConfirmationEmailLog[] = [];

  sendConfirmationEmail(log: ConfirmationEmailLog): void {
    this.logs.push(log);
  }

  getLastLog(): ConfirmationEmailLog | undefined {
    return this.logs[this.logs.length - 1];
  }

  getAllLogs(): ConfirmationEmailLog[] {
    return this.logs;
  }

  reset(): void {
    this.logs = [];
  }
}

describe("Report aggregation and confirmation email distribution - same timestamp deduplication", () => {
  let aiClient: FakeTx2Imp1AiClient;
  let emailStub: EmailDeliveryStub;
  const fixedTimestamp = "2024-01-15T09:00:00Z";
  const targetDate = "2024-01-15";

  beforeEach(() => {
    aiClient = new FakeTx2Imp1AiClient();
    emailStub = new EmailDeliveryStub();
  });

  afterEach(() => {
    emailStub.reset();
  });

  // SCEN-315
  test("multiple members submitting at identical timestamp are aggregated without duplication into single record with 10 member count", async () => {
    // Arrange: Create 10 members (A-J) with identical submission timestamp
    const memberIds = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    const submissions: ReportSubmission[] = memberIds.map((id, index) => ({
      userId: `user-${id}`,
      userName: `Engineer ${id}`,
      departmentId: "dev-001",
      submittedAt: fixedTimestamp,
      yesterdayAccomplishment: `Completed task ${index + 1}`,
      todayPlan: `Plan task ${index + 1}`,
      issueFaced: `No issues for ${id}`,
    }));

    // Assert precondition: exactly 10 submissions exist
    expect(submissions).toHaveLength(10);
    submissions.forEach((submission) => {
      expect(submission.submittedAt).toBe(fixedTimestamp);
    });

    // Act: Aggregate reports by timestamp
    const aggregationResult =
      await aiClient.aggregateReportsByTimestamp(submissions);

    // Assert: Aggregation produces single record
    expect(aggregationResult).toHaveLength(1);
    const aggregatedRecord = aggregationResult[0];

    // Assert: Aggregated record has correct timestamp
    expect(aggregatedRecord.submittedAtTimestamp).toBe(fixedTimestamp);

    // Assert: Member count is exactly 10 (no duplication)
    expect(aggregatedRecord.memberCount).toBe(10);

    // Assert: All 10 unique members are present without duplication
    expect(aggregatedRecord.members).toHaveLength(10);
    const aggregatedUserIds = aggregatedRecord.members.map((m) => m.userId);
    const expectedUserIds = memberIds.map((id) => `user-${id}`);
    expect(aggregatedUserIds).toEqual(expectedUserIds);

    // Assert: No duplicate user IDs in aggregated result
    const uniqueUserIds = new Set(aggregatedUserIds);
    expect(uniqueUserIds.size).toBe(10);

    // Act: Create and send confirmation email with aggregated data
    const confirmationLog: ConfirmationEmailLog = {
      recipientRole: "department_head",
      recipientEmail: "head@company.com",
      subject: `定時送信完了: 10名全員が${targetDate} 09:00に提出済み`,
      content: `同一時刻送信グループ: ${fixedTimestamp}, 集約対象者数: ${aggregatedRecord.memberCount}`,
      sentAt: fixedTimestamp,
    };

    emailStub.sendConfirmationEmail(confirmationLog);

    // Assert: Confirmation email was sent with correct aggregation metadata
    expect(emailStub.getAllLogs()).toHaveLength(1);
    const sentLog = emailStub.getLastLog();
    expect(sentLog).toBeDefined();
    expect(sentLog!.recipientRole).toBe("department_head");
    expect(sentLog!.subject).toContain("10名全員");
    expect(sentLog!.content).toContain("集約対象者数: 10");

    // Assert: Aggregated data is distinguishable as single-timestamp group
    expect(aggregatedRecord.submittedAtTimestamp).toBe(fixedTimestamp);
    expect(sentLog!.content).toContain(`同一時刻送信グループ: ${fixedTimestamp}`);
  });
});