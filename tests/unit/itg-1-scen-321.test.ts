import { prioritizeUnreportedMembers } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-321
  test("催促対象部員の優先順位付け機能 - 遅延部員のみが存在する場合、全員が催促対象として抽出される", () => {
    const unreported_members = [
      {
        user_id: "ENG_001",
        user_name: "部員A",
        report_status: "unreported",
        report_deadline: "2024-01-15T08:00:00Z",
        current_time: "2024-01-15T09:30:00Z",
      },
      {
        user_id: "ENG_002",
        user_name: "部員B",
        report_status: "unreported",
        report_deadline: "2024-01-15T08:00:00Z",
        current_time: "2024-01-15T09:30:00Z",
      },
      {
        user_id: "ENG_003",
        user_name: "部員C",
        report_status: "unreported",
        report_deadline: "2024-01-15T08:00:00Z",
        current_time: "2024-01-15T09:30:00Z",
      },
      {
        user_id: "ENG_004",
        user_name: "部員D",
        report_status: "unreported",
        report_deadline: "2024-01-15T08:00:00Z",
        current_time: "2024-01-15T09:30:00Z",
      },
      {
        user_id: "ENG_005",
        user_name: "部員E",
        report_status: "unreported",
        report_deadline: "2024-01-15T08:00:00Z",
        current_time: "2024-01-15T09:30:00Z",
      },
    ];

    const result = prioritizeUnreportedMembers(unreported_members);

    expect(result).toHaveLength(5);
    expect(result.every((member) => member.report_status === "unreported")).toBe(
      true
    );
    expect(
      result.every((member) => member.priority_level === "high")
    ).toBe(true);
    expect(result.map((member) => member.user_id)).toEqual([
      "ENG_001",
      "ENG_002",
      "ENG_003",
      "ENG_004",
      "ENG_005",
    ]);
    expect(result.every((member) => member.should_prompt === true)).toBe(true);
  });
});