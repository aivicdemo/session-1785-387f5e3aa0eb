import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  initializeSystem,
  createUser,
  setReportStatus,
  submitReport,
  judgeSubmissionStatus,
} from "../../src/logic/it-1";

describe("朝会報告送信状況判定機能", () => {
  // SCEN-193
  test("全部員が日報を送信済みの場合、全員送信完了と判定される", async () => {
    const mock_sent_emails: Array<{ recipient: string; subject: string; body: string }> = [];

    const mock_email_service = {
      send: (recipient: string, subject: string, body: string) => {
        mock_sent_emails.push({ recipient, subject, body });
        return Promise.resolve();
      },
    };

    const test_dept_id = "DEPT_001";
    const test_morning_meeting_time = new Date("2024-01-15T09:00:00Z");
    const test_user_count = 10;
    const test_users: Array<{
      user_id: string;
      user_name: string;
      department_id: string;
    }> = [];

    await initializeSystem({
      department_id: test_dept_id,
      morning_meeting_start_time: test_morning_meeting_time,
      email_service: mock_email_service,
    });

    for (let i = 1; i <= test_user_count; i++) {
      const user_id = `USER_${String(i).padStart(3, "0")}`;
      const user_name = `Engineer_${i}`;
      await createUser({
        user_id,
        user_name,
        department_id: test_dept_id,
      });
      test_users.push({
        user_id,
        user_name,
        department_id: test_dept_id,
      });
    }

    for (const user of test_users) {
      await setReportStatus({
        user_id: user.user_id,
        status: "NOT_SUBMITTED",
        report_date: "2024-01-15",
      });
    }

    for (let i = 0; i < test_user_count; i++) {
      const user = test_users[i];
      const submission_timestamp = new Date("2024-01-15T08:45:00Z");

      await submitReport({
        user_id: user.user_id,
        report_date: "2024-01-15",
        yesterday_accomplishment:
          "Completed task " + String(i + 1),
        today_plan: "Plan for task " + String(i + 1),
        current_issues: "Issue " + String(i + 1),
        submitted_at: submission_timestamp,
      });
    }

    const judgment_result = await judgeSubmissionStatus({
      department_id: test_dept_id,
      report_date: "2024-01-15",
      expected_member_count: test_user_count,
    });

    expect(judgment_result.status).toBe("ALL_SUBMITTED");
    expect(judgment_result.submitted_count).toBe(10);
    expect(judgment_result.total_count).toBe(10);
    expect(judgment_result.completion_percentage).toBe(100);

    const confirmation_email_found = mock_sent_emails.some(
      (email) =>
        email.subject.includes("日報") &&
        email.body.includes("10名全員の日報が揃いました")
    );
    expect(confirmation_email_found).toBe(true);
  });
});