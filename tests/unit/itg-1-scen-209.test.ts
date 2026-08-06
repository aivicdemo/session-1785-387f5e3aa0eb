import { describe, test, expect, beforeEach } from "@jest/globals";
import { judgeReportSubmissionStatus } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-209: [edge] 日報送信状況判定機能 - 朝会開始予定時刻の直前にすべての部員が日報送信済みの場合、全員送信完了と判定される
  test("should determine all members have submitted reports when all 10 members submitted before meeting start time", () => {
    const meeting_start_time = new Date("2024-01-15T09:00:00Z");
    const judgment_time = new Date("2024-01-15T08:59:45Z");
    const submission_time_all_members = new Date("2024-01-15T08:59:30Z");

    const members_submission_data = [
      {
        member_id: "A",
        last_submission_time: submission_time_all_members,
        yesterday_achievement: "completed task 1",
        today_plan: "start task 2",
        current_issue: "blocked by resource",
      },
      {
        member_id: "B",
        last_submission_time: submission_time_all_members,
        yesterday_achievement: "reviewed code",
        today_plan: "fix bugs",
        current_issue: "none",
      },
      {
        member_id: "C",
        last_submission_time: submission_time_all_members,
        yesterday_achievement: "deployed feature",
        today_plan: "monitor system",
        current_issue: "api latency",
      },
      {
        member_id: "D",
        last_submission_time: submission_time_all_members,
        yesterday_achievement: "attended meeting",
        today_plan: "document api",
        current_issue: "none",
      },
      {
        member_id: "E",
        last_submission_time: submission_time_all_members,
        yesterday_achievement: "tested component",
        today_plan: "refactor code",
        current_issue: "performance issue",
      },
      {
        member_id: "F",
        last_submission_time: submission_time_all_members,
        yesterday_achievement: "fixed bug",
        today_plan: "write tests",
        current_issue: "none",
      },
      {
        member_id: "G",
        last_submission_time: submission_time_all_members,
        yesterday_achievement: "completed design",
        today_plan: "implement ui",
        current_issue: "design approval pending",
      },
      {
        member_id: "H",
        last_submission_time: submission_time_all_members,
        yesterday_achievement: "setup database",
        today_plan: "migration script",
        current_issue: "none",
      },
      {
        member_id: "I",
        last_submission_time: submission_time_all_members,
        yesterday_achievement: "research library",
        today_plan: "prototype integration",
        current_issue: "compatibility issue",
      },
      {
        member_id: "J",
        last_submission_time: submission_time_all_members,
        yesterday_achievement: "code review",
        today_plan: "optimize query",
        current_issue: "database slow",
      },
    ];

    const result = judgeReportSubmissionStatus({
      meeting_start_time,
      judgment_time,
      members_submission_data,
    });

    expect(result.status).toBe("all_submitted");
    expect(result.total_members).toBe(10);
    expect(result.submitted_members).toBe(10);
    expect(result.unsubmitted_members).toBe(0);
    expect(result.delayed_members).toBe(0);
  });
});