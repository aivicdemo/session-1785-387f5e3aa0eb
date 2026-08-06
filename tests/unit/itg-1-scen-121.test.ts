import { validateAndSendConfirmationEmail } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  test("SCEN-121: [error] 確認メール自動配信機能 - 今日の予定が空文字列のとき、メール送信処理が実行されない", () => {
    // Arrange: メール送信サービスをスタブで初期化
    const mockEmailService = {
      send: jest.fn().mockResolvedValue({ success: true }),
    };

    // 朝会報告データを構築：昨日やったこと『完了』、今日の予定『』（空文字列）、抱えている課題『なし』
    const morningReportData = {
      yesterday_achievements: "完了",
      todays_plan: "",
      current_issues: "なし",
    };

    // Act: 確認メール自動配信機能を呼び出し
    validateAndSendConfirmationEmail(morningReportData, mockEmailService);

    // Assert: メール送信サービスのスタブが1度も呼び出されないことを確認
    expect(mockEmailService.send).not.toHaveBeenCalled();
  });
});