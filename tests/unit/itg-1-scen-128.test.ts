import { validateAndSendMorningReportWithConfirmationEmail } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-128: [error] 確認メール自動配信機能 - 部長のメールアドレスがnullのとき、メール送信処理が実行されない
  test("部長のメールアドレスがnullのとき、メール送信処理が実行されず、エラーログが記録される", () => {
    const mockEmailService = {
      send: jest.fn(),
    };

    const mockLogger = {
      error: jest.fn(),
    };

    const report_input = {
      yesterday_achievement: "昨日はA機能の実装を完了しました",
      today_plan: "本日はB機能のテストを実施します",
      issue: "C機能の設計に関して意見が必要です",
    };

    const manager_info = {
      name: "開発部長",
      email: null,
    };

    const engineer_info = {
      user_id: "ENG001",
      name: "エンジニア太郎",
      email: "engineer_taro@example.com",
    };

    validateAndSendMorningReportWithConfirmationEmail(
      report_input,
      manager_info,
      engineer_info,
      mockEmailService,
      mockLogger
    );

    expect(mockEmailService.send).toHaveBeenCalledTimes(0);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringMatching(/部長のメールアドレスがnull/)
    );
  });
});