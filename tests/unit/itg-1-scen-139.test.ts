import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import fetchMock from "jest-fetch-mock";
import { submitDailyReport } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-139
  test("確認メール自動配信機能 - 送信者本人と開発部長が同一人物の場合、メール送信先は重複排除されて1通のみ送信される", async () => {
    const userId = "user001";
    const userEmail = "user001@example.com";
    const managerEmail = "user001@example.com";

    const reportInput = {
      userId,
      yesterdayAccomplishment: "○○の実装",
      todayPlan: "□□のテスト",
      openIssues: "△△の検討",
      submittedAt: new Date("2024-01-15T08:30:00Z"),
    };

    const fetchCalls: Array<{
      url: string;
      method: string;
      body: Record<string, unknown>;
    }> = [];

    fetchMock.mockImplementation(
      async (url: string | Request, options?: RequestInit) => {
        const urlStr = typeof url === "string" ? url : url.toString();
        const body =
          options?.body && typeof options.body === "string"
            ? JSON.parse(options.body)
            : {};

        fetchCalls.push({
          url: urlStr,
          method: options?.method || "GET",
          body,
        });

        if (urlStr.includes("/api/report/submit")) {
          return new Response(
            JSON.stringify({
              success: true,
              reportId: "report_20240115_001",
            }),
            { status: 200 }
          );
        }

        if (urlStr.includes("/api/mail/send")) {
          return new Response(
            JSON.stringify({
              success: true,
              messageId: "msg_001",
            }),
            { status: 200 }
          );
        }

        if (urlStr.includes("/api/user/current")) {
          return new Response(
            JSON.stringify({
              userId,
              email: userEmail,
            }),
            { status: 200 }
          );
        }

        if (urlStr.includes("/api/user/manager")) {
          return new Response(
            JSON.stringify({
              userId,
              email: managerEmail,
            }),
            { status: 200 }
          );
        }

        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
        });
      }
    );

    await submitDailyReport(reportInput);

    const mailSendCalls = fetchCalls.filter((call) =>
      call.url.includes("/api/mail/send")
    );

    expect(mailSendCalls.length).toBe(1);

    const mailBody = mailSendCalls[0].body;
    const recipients =
      Array.isArray(mailBody.to) && mailBody.to.length > 0
        ? mailBody.to
        : typeof mailBody.to === "string"
          ? [mailBody.to]
          : [];

    const ccRecipients =
      Array.isArray(mailBody.cc) && mailBody.cc.length > 0
        ? mailBody.cc
        : typeof mailBody.cc === "string"
          ? [mailBody.cc]
          : [];

    const bccRecipients =
      Array.isArray(mailBody.bcc) && mailBody.bcc.length > 0
        ? mailBody.bcc
        : typeof mailBody.bcc === "string"
          ? [mailBody.bcc]
          : [];

    const allRecipients = [...recipients, ...ccRecipients, ...bccRecipients];

    const emailCount = allRecipients.filter(
      (email: string) => email === userEmail
    ).length;
    expect(emailCount).toBe(1);

    const uniqueRecipients = new Set(allRecipients);
    expect(uniqueRecipients.size).toBe(allRecipients.length);
  });
});