import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { sendReminderEmailsOnTimeout } from "../../src/logic/it-1-br-1-1-1";

const fetchMock = require("jest-fetch-mock");

describe("Report reminder email notification on service timeout", () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    fetchMock.disableMocks();
  });

  // SCEN-515
  test("should handle mail service timeout and mark reminder status as failed", async () => {
    const meetingStartTime = new Date("2024-01-15T09:00:00Z");
    const currentTime = new Date("2024-01-15T09:30:00Z");
    jest.setSystemTime(currentTime);

    const unreportedMembers = [
      {
        userId: "ENG001",
        userName: "Alice Engineer",
        departmentId: "DEV001",
        email: "alice@company.com",
      },
      {
        userId: "ENG002",
        userName: "Bob Developer",
        departmentId: "DEV001",
        email: "bob@company.com",
      },
    ];

    const managerEmail = "manager@company.com";
    const managerName = "Development Manager";

    const mailServiceResponse = {
      success: false,
      error: "TimeoutError: メール送信サービス接続タイムアウト",
      timestamp: currentTime.toISOString(),
    };

    fetchMock.mockResponseOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () => {
              resolve({
                body: JSON.stringify(mailServiceResponse),
                status: 500,
                headers: { "Content-Type": "application/json" },
              });
            },
            30000
          );
        })
    );

    const input = {
      unreportedMembers: unreportedMembers,
      managerEmail: managerEmail,
      managerName: managerName,
      meetingStartTime: meetingStartTime.toISOString(),
      currentTime: currentTime.toISOString(),
      timeoutThresholdMs: 30000,
    };

    const result = await sendReminderEmailsOnTimeout(input);

    expect(result).toEqual({
      status: "failed",
      reminderSendStatus: "失敗",
      error: "TimeoutError: メール送信サービス接続タイムアウト",
      processedMembers: 0,
      failedMembers: 2,
      unreportedMemberIds: ["ENG001", "ENG002"],
      systemLog: expect.stringContaining(
        "TimeoutError: メール送信サービス接続タイムアウト"
      ),
      unreportedDataPreserved: true,
    });

    expect(result.reminderSendStatus).toBe("失敗");
    expect(result.failedMembers).toBe(2);
    expect(result.error).toMatch(/TimeoutError/);
  });
});