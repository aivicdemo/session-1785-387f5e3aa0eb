import { prioritizeRemindTargetMembers } from "../../src/logic/it-1-br-1-1-1";

describe("報告送信時に、送信者本人と部長宛に確認メールを自動配信する機能", () => {
  // SCEN-330
  test("催促対象部員の優先順位付け機能 - 部長 ID が空文字列のとき処理がエラーになる", () => {
    const manager_id = "";
    const non_submitted_members = [
      {
        user_id: "user_001",
        user_name: "田中太郎",
        department_id: "dept_dev",
      },
    ];
    const delayed_members = [
      {
        user_id: "user_002",
        user_name: "鈴木花子",
        department_id: "dept_dev",
        submission_time: new Date("2024-01-15T09:15:00Z"),
      },
    ];
    const meeting_start_time = new Date("2024-01-15T09:00:00Z");

    expect(() =>
      prioritizeRemindTargetMembers(
        manager_id,
        non_submitted_members,
        delayed_members,
        meeting_start_time
      )
    ).toThrow(/部長ID/);
  });
});