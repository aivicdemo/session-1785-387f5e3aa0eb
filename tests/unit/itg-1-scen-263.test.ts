import { describe, test, expect } from "@jest/globals";
import { sendReportConfirmationEmails } from "../../src/logic/it-1-br-1-1-1";

describe("朝会報告送信時に送信者本人と部長宛に確認メールを自動配信する機能", () => {
  // SCEN-263: [error] 朝会報告送信時刻遅延判定機能 - 送信者メールアドレスが null のとき処理が失敗する
  test("送信者メールアドレスが null の場合、送信者メールアドレスが null ですというエラーが発生すること", () => {
    const reportData = {
      reportId: "report-001",
      senderId: "user-001",
      senderEmail: null,
      senderName: "田中太郎",
      departmentHeadEmail: "head@example.com",
      departmentHeadName: "佐藤部長",
      yesterdayAccomplishment: "タスク A を完了した",
      todayPlan: "タスク B を開始する",
      currentIssue: "外部ライブラリの問題を調査中",
      sentAt: new Date("2024-01-15T09:30:00Z"),
      morningMeetingStartTime: new Date("2024-01-15T10:00:00Z"),
    };

    expect(() => sendReportConfirmationEmails(reportData)).toThrow(
      /送信者メールアドレス/
    );
  });
});