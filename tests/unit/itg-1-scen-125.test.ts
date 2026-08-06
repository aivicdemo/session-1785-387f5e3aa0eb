import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { sendConfirmationEmail } from "../../src/logic/it-1";

const fetchMock = require("jest-fetch-mock");

describe("日報入力フォームの提供と送信機能 - 確認メール自動配信", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    fetchMock.enableMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-125
  test("[error] 確認メール自動配信機能 - 送信者のメールアドレスが空文字列のとき、メール送信処理が実行されない", async () => {
    const sender_email = "";
    const recipient_email = "manager@example.com";
    const subject = "日報確認メール";
    const body = "本日の日報が送信されました。内容をご確認ください。";

    fetchMock.mockResponseOnce(JSON.stringify({}), { status: 200 });

    const result = await sendConfirmationEmail({
      sender_email,
      recipient_email,
      subject,
      body,
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/送信者メールアドレス/);
  });
});