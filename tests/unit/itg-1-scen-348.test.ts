import { determinePrioritizedMembersForPrompt } from "../../src/logic/it-1-br-1-1-1";

describe("催促対象部員優先順位付与機能", () => {
  test("SCEN-348: 期限日と現在日時が同日の場合、送信ステータスに基づき未送信部員を正確に判定", () => {
    // Arrange
    const now = new Date("2024-01-15T09:00:00Z");
    const deadline = new Date("2024-01-15T23:59:59Z");

    const unsent_report = {
      id: "report_001",
      user_id: "user_101",
      department_id: "dept_01",
      deadline_date: deadline,
      submission_status: "unsent" as const,
      submitted_at: null,
      yesterday_achievement: "実績テキスト",
      today_plan: "予定テキスト",
      issues: "課題テキスト",
      created_at: new Date("2024-01-15T08:00:00Z"),
    };

    const sent_report = {
      id: "report_002",
      user_id: "user_102",
      department_id: "dept_01",
      deadline_date: deadline,
      submission_status: "sent" as const,
      submitted_at: new Date("2024-01-15T08:30:00Z"),
      yesterday_achievement: "実績テキスト",
      today_plan: "予定テキスト",
      issues: "課題テキスト",
      created_at: new Date("2024-01-15T08:00:00Z"),
    };

    const reports = [unsent_report, sent_report];

    // Act
    const result = determinePrioritizedMembersForPrompt(reports, now);

    // Assert
    expect(result).toEqual([
      {
        user_id: "user_101",
        department_id: "dept_01",
        priority: 1,
        reason: "unsent",
      },
    ]);
    expect(result.length).toBe(1);
    expect(result[0].user_id).toBe("user_101");
    expect(result[0].priority).toBe(1);
    expect(result[0].reason).toBe("unsent");
  });
});