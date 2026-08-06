import { sendMorningReportConfirmationEmails } from "../../src/logic/it-1";

describe("朝会報告の確認メール自動配信機能", () => {
  test("SCEN-136: 開発部長のメールアドレスが空文字列の場合、メール送信対象から除外される", () => {
    // Arrange
    const reportId = "report-001";
    const reporterId = "engineer-001";
    const reporterName = "田中太郎";
    const reporterEmail = "tanaka@example.com";
    const yesterday = "昨日は機能Aの実装を完了しました";
    const today = "本日は機能Bの実装を開始します";
    const issues = "期間が短いため納期に懸念があります";
    const directorEmail = "";
    const mealServiceMock = jest.fn();

    const report = {
      reportId,
      reporterId,
      reporterName,
      reporterEmail,
      yesterday,
      today,
      issues,
      sentAt: new Date("2024-01-15T09:00:00Z"),
    };

    const recipients = [
      { role: "reporter", email: reporterEmail },
      { role: "director", email: directorEmail },
    ];

    // Act
    sendMorningReportConfirmationEmails(report, recipients, mealServiceMock);

    // Assert
    // メール送信APIが呼び出された回数を確認（部員のみ1回）
    expect(mealServiceMock).toHaveBeenCalledTimes(1);

    // 実際の呼び出し引数を確認
    const callArgs = mealServiceMock.mock.calls[0][0];
    expect(callArgs.to).toBe(reporterEmail);
    expect(callArgs.to).not.toBe("");
    expect(callArgs.to).not.toContain(directorEmail);

    // 空のメールアドレスでの呼び出しが発生しないこと
    const allCalls = mealServiceMock.mock.calls;
    allCalls.forEach((call) => {
      expect(call[0].to).not.toBe("");
    });
  });
});