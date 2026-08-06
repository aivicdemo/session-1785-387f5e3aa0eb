import { validateAndSendConfirmationEmail } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  test("SCEN-119: 昨日の実績が空文字列のとき、メール送信処理が実行されない", () => {
    const mockSmtpClient = {
      sendEmail: jest.fn().mockResolvedValue({ success: true }),
    };

    const reportData = {
      yesterdayResult: "",
      todayPlan: "今日はデータベース最適化を実施する予定です。",
      issuesToHandle: "本番環境のメモリリーク問題に対応が必要。",
      reporterId: "user-001",
      reportDate: "2024-01-15",
    };

    validateAndSendConfirmationEmail(reportData, mockSmtpClient);

    expect(mockSmtpClient.sendEmail).not.toHaveBeenCalled();
  });
});