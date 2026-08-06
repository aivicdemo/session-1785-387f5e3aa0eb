import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { sendConfirmationEmails } from "../../src/logic/it-1-br-1-1-1";

describe("確認メール配信機能", () => {
  let emailServiceSpy: jest.Mock;
  let dbLogSpy: jest.Mock;

  beforeEach(() => {
    emailServiceSpy = jest.fn();
    dbLogSpy = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // SCEN-299
  test("送信者ユーザーIDが空文字のとき、メール配信処理が中断されてエラーが投げられる", () => {
    const senderUserId = "";
    const recipientEmail = "manager@example.com";
    const emailBody = "Yesterday: completed task A. Today: planning task B. Issue: none.";
    const emailTitle = "Daily Report Confirmation";

    expect(() =>
      sendConfirmationEmails({
        senderUserId,
        recipientEmail,
        emailBody,
        emailTitle,
      })
    ).toThrow(/INVALID_SENDER_ID/);

    expect(emailServiceSpy).not.toHaveBeenCalled();
    expect(dbLogSpy).not.toHaveBeenCalled();
  });
});