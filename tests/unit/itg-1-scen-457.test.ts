import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

const fetchMock = require("jest-fetch-mock");

describe("報告送信時に、送信者本人と部長宛に確認メールを自動配信する機能", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-457
  it("部長ユーザーIDが欠落しているとき、ステータス400とエラーメッセージが返却される", async () => {
    const requestBody = {
      reportId: "report-001",
      reporterUserId: "eng-001",
      departmentId: "dev-001",
      reportContent: {
        yesterday: "テスト実装完了",
        today: "コードレビュー予定",
        issues: "データベース接続タイムアウト",
      },
      submittedAt: "2024-01-15T08:30:00Z",
      managerUserId: null,
    };

    const expectedErrorResponse = {
      statusCode: 400,
      errorCode: "INVALID_REQUEST",
      message: "部長ユーザーIDは必須項目です",
    };

    fetchMock.mockResponseOnce(JSON.stringify(expectedErrorResponse), {
      status: 400,
    });

    const response = await fetch(
      "http://localhost:3000/api/reports/send-confirmation-email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    expect(response.status).toBe(400);

    const responseBody = await response.json();
    expect(responseBody.statusCode).toBe(400);
    expect(responseBody.message).toMatch(/部長ユーザーID/);
    expect(responseBody.message).toMatch(/必須/);
  });
});