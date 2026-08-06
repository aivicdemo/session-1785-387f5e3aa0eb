import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

// Mock AI client interface
interface Tx2Imp1AiClient {
  judgeUnsubmittedAndDelayedMembers(
    memberSubmissionData: MemberSubmissionData[]
  ): Promise<JudgmentResult>;
}

interface MemberSubmissionData {
  employee_id: string;
  name: string;
  submitted: boolean;
  submission_timestamp?: string;
  deadline_timestamp: string;
}

interface JudgmentResult {
  unsubmitted_members: UnsubmittedMember[];
  delayed_members: DelayedMember[];
}

interface UnsubmittedMember {
  employee_id: string;
  name: string;
}

interface DelayedMember {
  employee_id: string;
  name: string;
  delayed_minutes: number;
}

// Import the orchestrator and related logic
import { runTx2Imp1Agent } from "../../src/logic/it-1";

describe("日報収集から報告漏れ特定までの自動判定と通知", () => {
  let mockAiClient: Tx2Imp1AiClient;
  let aiClientCallCount: number;

  beforeEach(() => {
    aiClientCallCount = 0;

    // Create stub AI client
    mockAiClient = {
      judgeUnsubmittedAndDelayedMembers: async (
        memberSubmissionData: MemberSubmissionData[]
      ): Promise<JudgmentResult> => {
        aiClientCallCount++;

        // Process member submission data to identify unsubmitted and delayed members
        const unsubmitted_members: UnsubmittedMember[] = [];
        const delayed_members: DelayedMember[] = [];

        memberSubmissionData.forEach((member) => {
          if (!member.submitted) {
            // Member has not submitted
            unsubmitted_members.push({
              employee_id: member.employee_id,
              name: member.name,
            });
          } else if (member.submission_timestamp) {
            // Check if submission is delayed
            const submission_time = new Date(member.submission_timestamp);
            const deadline_time = new Date(member.deadline_timestamp);

            if (submission_time > deadline_time) {
              const delayed_ms =
                submission_time.getTime() - deadline_time.getTime();
              const delayed_minutes = Math.floor(delayed_ms / 60000);

              delayed_members.push({
                employee_id: member.employee_id,
                name: member.name,
                delayed_minutes: delayed_minutes,
              });
            }
          }
        });

        return {
          unsubmitted_members,
          delayed_members,
        };
      },
    };
  });

  afterEach(() => {
    aiClientCallCount = 0;
  });

  // SCEN-544
  it("should automatically judge unsubmitted and delayed members correctly with 10 engineers, 8 on-time submissions, 1 unsubmitted, 1 delayed", async () => {
    // Setup test data: 10 engineers total
    // 8 submitted on time, 1 unsubmitted, 1 delayed
    const deadline_timestamp = "2024-01-15T09:00:00Z";

    const member_submission_data: MemberSubmissionData[] = [
      // 8 members submitted on time
      {
        employee_id: "ENG001",
        name: "Engineer 1",
        submitted: true,
        submission_timestamp: "2024-01-15T08:30:00Z",
        deadline_timestamp: deadline_timestamp,
      },
      {
        employee_id: "ENG002",
        name: "Engineer 2",
        submitted: true,
        submission_timestamp: "2024-01-15T08:45:00Z",
        deadline_timestamp: deadline_timestamp,
      },
      {
        employee_id: "ENG003",
        name: "Engineer 3",
        submitted: true,
        submission_timestamp: "2024-01-15T08:15:00Z",
        deadline_timestamp: deadline_timestamp,
      },
      {
        employee_id: "ENG004",
        name: "Engineer 4",
        submitted: true,
        submission_timestamp: "2024-01-15T08:50:00Z",
        deadline_timestamp: deadline_timestamp,
      },
      {
        employee_id: "ENG005",
        name: "Engineer 5",
        submitted: true,
        submission_timestamp: "2024-01-15T08:40:00Z",
        deadline_timestamp: deadline_timestamp,
      },
      {
        employee_id: "ENG006",
        name: "Engineer 6",
        submitted: true,
        submission_timestamp: "2024-01-15T08:55:00Z",
        deadline_timestamp: deadline_timestamp,
      },
      {
        employee_id: "ENG007",
        name: "Engineer 7",
        submitted: true,
        submission_timestamp: "2024-01-15T08:20:00Z",
        deadline_timestamp: deadline_timestamp,
      },
      {
        employee_id: "ENG008",
        name: "Engineer 8",
        submitted: true,
        submission_timestamp: "2024-01-15T08:35:00Z",
        deadline_timestamp: deadline_timestamp,
      },
      // 1 member unsubmitted
      {
        employee_id: "ENG009",
        name: "Engineer 9",
        submitted: false,
        deadline_timestamp: deadline_timestamp,
      },
      // 1 member submitted delayed (10 minutes late)
      {
        employee_id: "ENG010",
        name: "Engineer 10",
        submitted: true,
        submission_timestamp: "2024-01-15T09:10:00Z",
        deadline_timestamp: deadline_timestamp,
      },
    ];

    // Call orchestrator function with mocked AI client
    const result = await runTx2Imp1Agent(
      member_submission_data,
      mockAiClient
    );

    // Verify AI client was called exactly once
    expect(aiClientCallCount).toBe(1);

    // Verify judgment result structure
    expect(result).toHaveProperty("unsubmitted_members");
    expect(result).toHaveProperty("delayed_members");

    // Verify unsubmitted members list: 1 member (ENG009)
    expect(result.unsubmitted_members).toHaveLength(1);
    expect(result.unsubmitted_members[0]).toEqual({
      employee_id: "ENG009",
      name: "Engineer 9",
    });

    // Verify delayed members list: 1 member (ENG010, 10 minutes late)
    expect(result.delayed_members).toHaveLength(1);
    expect(result.delayed_members[0]).toEqual({
      employee_id: "ENG010",
      name: "Engineer 10",
      delayed_minutes: 10,
    });

    // Verify total count: exactly 2 problematic members (1 unsubmitted + 1 delayed)
    const total_problematic_count =
      result.unsubmitted_members.length + result.delayed_members.length;
    expect(total_problematic_count).toBe(2);

    // Verify no other fields are included in judgment result
    expect(Object.keys(result).sort()).toEqual([
      "delayed_members",
      "unsubmitted_members",
    ]);

    // Verify unsubmitted member object structure: only employee_id and name
    result.unsubmitted_members.forEach((member) => {
      expect(Object.keys(member).sort()).toEqual([
        "employee_id",
        "name",
      ]);
    });

    // Verify delayed member object structure: employee_id, name, and delayed_minutes only
    result.delayed_members.forEach((member) => {
      expect(Object.keys(member).sort()).toEqual([
        "delayed_minutes",
        "employee_id",
        "name",
      ]);
      expect(typeof member.delayed_minutes).toBe("number");
      expect(member.delayed_minutes).toBeGreaterThan(0);
    });
  });
});