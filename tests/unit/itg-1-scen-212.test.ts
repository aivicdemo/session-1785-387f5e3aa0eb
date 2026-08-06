import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { getUnreportedUsers, generateManagerNotificationEmail } from "../../src/logic/it-1";

const fetchMock = require("jest-fetch-mock");

describe("日報入力フォームの提供と送信機能", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-212: [edge] 日報送信状況判定機能 - 複数の未送信者が存在する場合、全員の情報が部長通知に含まれる
  it("should include all unreported users in manager notification email when multiple users have not submitted reports", async () => {
    const departmentId = "DEV001";
    const reportDeadline = new Date("2024-01-15T09:00:00Z");
    const checkTime = new Date("2024-01-15T08:55:00Z");
    const managerEmail = "manager@company.com";

    const allUsers = [
      { userId: "USER001", userName: "太郎", email: "taro@company.com", departmentId },
      { userId: "USER002", userName: "次子", email: "tsugiko@company.com", departmentId },
      { userId: "USER003", userName: "花子", email: "hanako@company.com", departmentId },
      { userId: "USER004", userName: "四郎", email: "shiro@company.com", departmentId },
      { userId: "USER005", userName: "次郎", email: "jiro@company.com", departmentId },
      { userId: "USER006", userName: "六美", email: "rokumi@company.com", departmentId },
      { userId: "USER007", userName: "由美", email: "yumi@company.com", departmentId },
      { userId: "USER008", userName: "八郎", email: "hachiro@company.com", departmentId },
      { userId: "USER009", userName: "健太", email: "kenta@company.com", departmentId },
      { userId: "USER010", userName: "十美", email: "tomi@company.com", departmentId },
    ];

    const submittedUserIds = ["USER002", "USER004", "USER006", "USER008", "USER010"];
    const unreportedUserIds = ["USER001", "USER003", "USER005", "USER007", "USER009"];

    const getUnreportedUsersPayload = {
      departmentId,
      allUsers,
      submittedUserIds,
      reportDeadline,
      checkTime,
    };

    const unreportedUsers = await getUnreportedUsers(getUnreportedUsersPayload);

    expect(unreportedUsers).toHaveLength(5);
    expect(unreportedUsers.map((u: any) => u.userId)).toEqual(unreportedUserIds);
    expect(unreportedUsers.map((u: any) => u.userName)).toEqual([
      "太郎",
      "花子",
      "次郎",
      "由美",
      "健太",
    ]);

    const notificationPayload = {
      departmentId,
      managerEmail,
      unreportedUsers,
      reportDeadline,
    };

    const notificationEmail = await generateManagerNotificationEmail(notificationPayload);

    expect(notificationEmail).toHaveProperty("to", managerEmail);
    expect(notificationEmail).toHaveProperty("subject");
    expect(notificationEmail.subject).toMatch(/未送信/);

    const emailBody = notificationEmail.body;
    expect(emailBody).toContain("太郎");
    expect(emailBody).toContain("花子");
    expect(emailBody).toContain("次郎");
    expect(emailBody).toContain("由美");
    expect(emailBody).toContain("健太");

    const allNamesCount =
      (emailBody.match(/太郎/g) || []).length +
      (emailBody.match(/花子/g) || []).length +
      (emailBody.match(/次郎/g) || []).length +
      (emailBody.match(/由美/g) || []).length +
      (emailBody.match(/健太/g) || []).length;

    expect(allNamesCount).toBeGreaterThanOrEqual(5);

    fetchMock.mockResponseOnce(JSON.stringify({ success: true, sent: true }), {
      status: 200,
    });

    const sendResponse = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notificationEmail),
    });

    expect(sendResponse.status).toBe(200);
    expect(fetchMock.mock.calls).toHaveLength(1);

    const sentEmail = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sentEmail.to).toBe(managerEmail);
  });
});