import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { identifyUnreportedMembers } from "../../src/logic/it-1-br-1-1-1";

describe("報告送信時に、送信者本人と部長宛に確認メールを自動配信する機能", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // SCEN-246
  test("月末（31日）の朝会で報告漏れ部員が正しく視認できる", () => {
    // 現在日時を2024年1月31日午前8時に設定
    const targetDate = new Date("2024-01-31T08:00:00Z");
    jest.setSystemTime(targetDate);

    // 部員データ：A～H（8名）は報告済み、I、J（2名）は未報告
    const members = [
      { userId: "U001", name: "部員A", departmentId: "D001", hasReported: true, reportedAt: "2024-01-31T07:30:00Z" },
      { userId: "U002", name: "部員B", departmentId: "D001", hasReported: true, reportedAt: "2024-01-31T07:35:00Z" },
      { userId: "U003", name: "部員C", departmentId: "D001", hasReported: true, reportedAt: "2024-01-31T07:40:00Z" },
      { userId: "U004", name: "部員D", departmentId: "D001", hasReported: true, reportedAt: "2024-01-31T07:45:00Z" },
      { userId: "U005", name: "部員E", departmentId: "D001", hasReported: true, reportedAt: "2024-01-31T07:50:00Z" },
      { userId: "U006", name: "部員F", departmentId: "D001", hasReported: true, reportedAt: "2024-01-31T07:55:00Z" },
      { userId: "U007", name: "部員G", departmentId: "D001", hasReported: true, reportedAt: "2024-01-31T08:00:00Z" },
      { userId: "U008", name: "部員H", departmentId: "D001", hasReported: true, reportedAt: "2024-01-31T08:05:00Z" },
      { userId: "U009", name: "部員I", departmentId: "D001", hasReported: false },
      { userId: "U010", name: "部員J", departmentId: "D001", hasReported: false },
    ];

    // 朝会設定：当日朝9時が報告期限
    const meetingConfig = {
      meetingDate: "2024-01-31",
      meetingTimeUtc: "2024-01-31T09:00:00Z",
      reportDeadlineUtc: "2024-01-31T09:00:00Z",
    };

    // 実行：報告漏れ部員を特定
    const result = identifyUnreportedMembers({
      members,
      meetingConfig,
      currentTimeUtc: targetDate.toISOString(),
    });

    // 期待結果：部員I、Jのみが報告漏れ一覧に表示される
    expect(result.unreportedCount).toBe(2);
    expect(result.unreportedMembers).toHaveLength(2);

    // 部員Iの検証
    const memberI = result.unreportedMembers.find((m: { userId: string }) => m.userId === "U009");
    expect(memberI).toMatchObject({
      userId: "U009",
      name: "部員I",
      departmentId: "D001",
      status: "本日未報告",
      deadline: "2024-01-31T09:00:00Z",
    });

    // 部員Jの検証
    const memberJ = result.unreportedMembers.find((m: { userId: string }) => m.userId === "U010");
    expect(memberJ).toMatchObject({
      userId: "U010",
      name: "部員J",
      departmentId: "D001",
      status: "本日未報告",
      deadline: "2024-01-31T09:00:00Z",
    });

    // 報告済み部員がリストに含まれていないことを確認
    const reportedMemberIds = result.unreportedMembers.map((m: { userId: string }) => m.userId);
    expect(reportedMemberIds).not.toContain("U001");
    expect(reportedMemberIds).not.toContain("U002");
    expect(reportedMemberIds).not.toContain("U003");
    expect(reportedMemberIds).not.toContain("U004");
    expect(reportedMemberIds).not.toContain("U005");
    expect(reportedMemberIds).not.toContain("U006");
    expect(reportedMemberIds).not.toContain("U007");
    expect(reportedMemberIds).not.toContain("U008");

    // 月末判定フラグが正しく設定されている
    expect(result.isMonthEndDate).toBe(true);
    expect(result.targetDate).toBe("2024-01-31");
  });
});