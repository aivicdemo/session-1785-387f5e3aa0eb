import { notifyUnreportedMembers } from "../../src/logic/it-1-br-1-1-1";

describe("未報告部員催促通知機能 - 複数未報告者の並び順検証", () => {
  test("SCEN-524: 複数の未報告者が存在する場合、部員名の並び順が報告システムの登録順と一致する", () => {
    const members = [
      { id: "member_a", name: "部員A", department_id: "dev_dept" },
      { id: "member_b", name: "部員B", department_id: "dev_dept" },
      { id: "member_c", name: "部員C", department_id: "dev_dept" },
      { id: "member_d", name: "部員D", department_id: "dev_dept" },
    ];

    const submissions = [
      {
        user_id: "member_a",
        submitted_at: new Date("2024-01-15T10:00:00Z"),
      },
      {
        user_id: "member_c",
        submitted_at: new Date("2024-01-15T11:30:00Z"),
      },
    ];

    const deadline = new Date("2024-01-15T23:59:00Z");
    const check_time = new Date("2024-01-16T00:30:00Z");

    const result = notifyUnreportedMembers({
      members,
      submissions,
      deadline,
      check_time,
    });

    const unreported_member_names = result.unreported_members.map(
      (member) => member.name
    );

    expect(unreported_member_names).toEqual(["部員B", "部員D"]);
    expect(result.unreported_members[0].id).toBe("member_b");
    expect(result.unreported_members[1].id).toBe("member_d");
    expect(result.notification_message).toMatch(/部員B/);
    expect(result.notification_message).toMatch(/部員D/);
  });
});