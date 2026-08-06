import { sendConfirmationEmailIfValid } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-123
  test("確認メール自動配信機能 - 抱えている課題が空文字列のとき、メール送信処理が実行されない", () => {
    const mockSendMail = jest.fn().mockResolvedValue({ messageId: "mock-id" });

    const report_data = {
      yesterday_accomplishment: "タスクA完了",
      today_plan: "タスクB開始",
      challenges: "",
      sender_user_id: "user_001",
      sent_at: new Date("2024-01-15T08:30:00Z"),
    };

    const result = sendConfirmationEmailIfValid(
      report_data,
      mockSendMail,
    );

    expect(mockSendMail).not.toHaveBeenCalled();
    expect(result).toEqual({
      email_sent: false,
      reason: "challenges_empty",
    });
  });
});