import { getUnreportedMembers } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  test("SCEN-223: [normal] 報告漏れ部員の視認機能 - 全部員が報告を送信している場合、報告漏れ部員リストが空になる", () => {
    const total_members = 10;
    const reported_members = 10;
    const deadline_timestamp = new Date("2024-01-15T08:00:00Z").getTime();
    const current_timestamp = new Date("2024-01-15T09:30:00Z").getTime();

    const member_master = Array.from({ length: total_members }, (_, i) => ({
      member_id: `EMP${String(i + 1).padStart(3, "0")}`,
      member_name: `Engineer${i + 1}`,
      department_id: "DEV001",
      status: "active" as const,
    }));

    const sent_reports = Array.from(
      { length: reported_members },
      (_, i) => ({
        member_id: `EMP${String(i + 1).padStart(3, "0")}`,
        yesterday_achievement: "Completed task A",
        today_plan: "Plan task B",
        current_issue: "Issue X",
        sent_timestamp: deadline_timestamp - 60000,
      })
    );

    const input = {
      member_master,
      sent_reports,
      deadline_timestamp,
      current_timestamp,
    };

    const result = getUnreportedMembers(input);

    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });
});