import { sendConfirmationEmail } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-130: [error] 確認メール自動配信機能 - 送信者IDがnullのとき、メール送信処理が実行されない
  test("送信者IDがnullの場合、メール送信処理は実行されずバリデーションエラーが発生する", () => {
    const senderId = null;
    const recipientEmail = "manager@example.com";
    const reportContent = {
      yesterday: "昨日の実績",
      today: "本日の予定",
      issues: "抱えている課題",
    };

    expect(() =>
      sendConfirmationEmail({
        senderId,
        recipientEmail,
        reportContent,
      })
    ).toThrow(/送信者ID/);
  });
});