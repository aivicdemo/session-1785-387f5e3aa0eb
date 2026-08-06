import { validateReportSubmissionAndSendEmails } from "../../src/logic/it-1-br-1-1-1";

describe("報告期限判定機能 - 送信者の部長が組織に存在しないとき", () => {
  // SCEN-392
  test("催促判定ロジックが実行されず、催促メール送信処理が0件のまま終了し、エラーログに部長不在を記録する", () => {
    const senderId = "user_001";
    const invalidManagerId = "manager_nonexistent_999";
    const submissionTimestamp = new Date("2024-01-15T08:30:00Z");
    const meetingStartTime = new Date("2024-01-15T09:00:00Z");

    const senderInfo = {
      userId: senderId,
      userName: "田中太郎",
      departmentId: "dept_dev",
      managerId: invalidManagerId,
    };

    const reportData = {
      reporterId: senderId,
      yesterday: "昨日の実績をまとめた",
      today: "今日の予定を立てた",
      issues: "抱えている課題を記載",
      submittedAt: submissionTimestamp,
    };

    const organizationUsers = [
      {
        userId: senderId,
        userName: "田中太郎",
        role: "engineer",
      },
    ];

    const emailSendLog: Array<{
      recipientId: string;
      recipientEmail: string;
      subject: string;
      sentAt: Date;
    }> = [];

    const errorLogs: string[] = [];

    const result = validateReportSubmissionAndSendEmails(
      reportData,
      senderInfo,
      meetingStartTime,
      organizationUsers,
      emailSendLog,
      errorLogs
    );

    expect(result.promotionEmailsSent).toBe(0);
    expect(errorLogs.length).toBeGreaterThan(0);
    expect(errorLogs.some((log) => /部長が組織に存在しません/.test(log))).toBe(
      true
    );
    expect(
      errorLogs.some((log) => new RegExp(invalidManagerId).test(log))
    ).toBe(true);
    expect(result.confirmationEmailsSent).toBe(1);
  });
});