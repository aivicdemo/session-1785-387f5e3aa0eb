import { type Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/orchestrator";
import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx2Imp1Agent } from "../../src/agents/tx-2-imp-1/orchestrator";

interface MockUser {
  user_id: string;
  name: string;
  department_id: string;
}

interface MockReport {
  user_id: string;
  submission_date: string;
  submission_time: string;
}

interface UnsubmittedMember {
  user_id: string;
  name: string;
  unsubmitted_timestamp: string;
}

interface AgentResult {
  unsubmitted_members: UnsubmittedMember[];
  total_members: number;
  submitted_count: number;
}

class MockTx2Imp1AiClient implements Tx2Imp1AiClient {
  async analyzeReportStatus(
    _prompt: string
  ): Promise<{ unsubmitted_user_ids: string[] }> {
    return {
      unsubmitted_user_ids: ["user_A", "user_B", "user_C"],
    };
  }

  async notifyManager(_prompt: string): Promise<{ notified: boolean }> {
    return { notified: true };
  }
}

describe("日報収集から報告漏れ特定までの自動判定と通知", () => {
  let mock_ai_client: Tx2Imp1AiClient;
  let mock_users: MockUser[];
  let mock_submitted_reports: MockReport[];
  const check_timestamp_str = "2024-01-15T08:45:00Z";

  beforeEach(() => {
    mock_ai_client = new MockTx2Imp1AiClient();

    mock_users = [
      { user_id: "user_A", name: "部員A", department_id: "dept_dev" },
      { user_id: "user_B", name: "部員B", department_id: "dept_dev" },
      { user_id: "user_C", name: "部員C", department_id: "dept_dev" },
      { user_id: "user_D", name: "部員D", department_id: "dept_dev" },
      { user_id: "user_E", name: "部員E", department_id: "dept_dev" },
      { user_id: "user_F", name: "部員F", department_id: "dept_dev" },
      { user_id: "user_G", name: "部員G", department_id: "dept_dev" },
      { user_id: "user_H", name: "部員H", department_id: "dept_dev" },
      { user_id: "user_I", name: "部員I", department_id: "dept_dev" },
      { user_id: "user_J", name: "部員J", department_id: "dept_dev" },
    ];

    mock_submitted_reports = [
      {
        user_id: "user_D",
        submission_date: "2024-01-15",
        submission_time: "2024-01-15T07:30:00Z",
      },
      {
        user_id: "user_E",
        submission_date: "2024-01-15",
        submission_time: "2024-01-15T07:35:00Z",
      },
      {
        user_id: "user_F",
        submission_date: "2024-01-15",
        submission_time: "2024-01-15T07:40:00Z",
      },
      {
        user_id: "user_G",
        submission_date: "2024-01-15",
        submission_time: "2024-01-15T07:45:00Z",
      },
      {
        user_id: "user_H",
        submission_date: "2024-01-15",
        submission_time: "2024-01-15T07:50:00Z",
      },
      {
        user_id: "user_I",
        submission_date: "2024-01-15",
        submission_time: "2024-01-15T07:55:00Z",
      },
      {
        user_id: "user_J",
        submission_date: "2024-01-15",
        submission_time: "2024-01-15T08:00:00Z",
      },
    ];
  });

  afterEach(() => {
    mock_ai_client = null as any;
    mock_users = [];
    mock_submitted_reports = [];
  });

  // SCEN-281
  test("未送信部員が複数存在する場合、全員が未送信リストに列挙される", async () => {
    const submitted_user_ids = mock_submitted_reports.map((r) => r.user_id);
    const unsubmitted_user_ids = mock_users
      .map((u) => u.user_id)
      .filter((uid) => !submitted_user_ids.includes(uid));

    const all_members_count = mock_users.length;
    const submitted_count = mock_submitted_reports.length;

    expect(unsubmitted_user_ids).toEqual(["user_A", "user_B", "user_C"]);
    expect(unsubmitted_user_ids.length).toBe(3);
    expect(submitted_count).toBe(7);
    expect(all_members_count).toBe(10);

    const unsubmitted_members: UnsubmittedMember[] = unsubmitted_user_ids
      .map((uid) => {
        const user = mock_users.find((u) => u.user_id === uid);
        return {
          user_id: uid,
          name: user?.name || "",
          unsubmitted_timestamp: check_timestamp_str,
        };
      })
      .filter((member) => member.name !== "");

    expect(unsubmitted_members.length).toBe(3);
    expect(unsubmitted_members[0].user_id).toBe("user_A");
    expect(unsubmitted_members[0].name).toBe("部員A");
    expect(unsubmitted_members[0].unsubmitted_timestamp).toBe(check_timestamp_str);

    expect(unsubmitted_members[1].user_id).toBe("user_B");
    expect(unsubmitted_members[1].name).toBe("部員B");
    expect(unsubmitted_members[1].unsubmitted_timestamp).toBe(check_timestamp_str);

    expect(unsubmitted_members[2].user_id).toBe("user_C");
    expect(unsubmitted_members[2].name).toBe("部員C");
    expect(unsubmitted_members[2].unsubmitted_timestamp).toBe(check_timestamp_str);

    const result: AgentResult = {
      unsubmitted_members: unsubmitted_members,
      total_members: all_members_count,
      submitted_count: submitted_count,
    };

    expect(result.unsubmitted_members.length).toBe(3);
    expect(result.total_members).toBe(10);
    expect(result.submitted_count).toBe(7);
    expect(result.unsubmitted_members).toHaveLength(3);

    const unsubmitted_user_set = new Set(
      result.unsubmitted_members.map((m) => m.user_id)
    );
    expect(unsubmitted_user_set.size).toBe(3);
    expect(unsubmitted_user_set.has("user_A")).toBe(true);
    expect(unsubmitted_user_set.has("user_B")).toBe(true);
    expect(unsubmitted_user_set.has("user_C")).toBe(true);

    for (const submitted_user_id of submitted_user_ids) {
      expect(unsubmitted_user_set.has(submitted_user_id)).toBe(false);
    }

    for (const member of result.unsubmitted_members) {
      expect(member.user_id).toBeTruthy();
      expect(member.name).toBeTruthy();
      expect(member.unsubmitted_timestamp).toBeTruthy();
    }
  });
});