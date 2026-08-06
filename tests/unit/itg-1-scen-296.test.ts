import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { sendConfirmationEmails } from "../../src/logic/it-1-br-1-1-1";

const fetchMock = require("jest-fetch-mock");

describe("確認メール配信機能", () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-296
  test("報告内容（2項目目）がnullのとき、メール配信処理が中断される", async () => {
    const report_data = {
      user_id: "user1",
      report_date: "2024-01-15",
      content_1: "昨日の作業内容",
      content_2: null,
      content_3: "抱えている課題",
    };

    const mail_send_response = {
      success: false,
      error: "報告内容2",
      message: "報告内容（2項目目）がnullのため配信処理を中断した",
    };

    fetchMock.mockResponseOnce(JSON.stringify(mail_send_response), {
      status: 400,
    });

    expect(() => sendConfirmationEmails(report_data)).toThrow(/報告内容/);
  });
});