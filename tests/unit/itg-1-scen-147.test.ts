import { validateAndSendReport } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-147: [error] 日報送信重複チェック機能 - 送信者ユーザーIDが空文字列のとき送信を拒否する
  test("送信者ユーザーIDが空文字列のとき、バリデーションエラーを返す", () => {
    const input = {
      userId: "",
      yesterday: "昨日は機能Aの実装を完了しました",
      today: "本日は機能Bの実装を開始します",
      issues: "データベース接続でタイムアウトが発生しています",
      sentAt: new Date("2024-01-15T09:00:00Z"),
    };

    expect(() => validateAndSendReport(input)).toThrow(/ユーザーID/);
  });
});