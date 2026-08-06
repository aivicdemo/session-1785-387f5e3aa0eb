import { submitDailyReport } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-177: [edge] 朝会報告送信バリデーション - 項目1の文字数が最大許容値ちょうどで送信が続行される
  test("項目1が最大許容文字数ちょうど（300文字）の場合、バリデーションエラーが発生せず、送信処理が続行される", () => {
    const fetchMock = require("jest-fetch-mock");
    fetchMock.resetMocks();

    // 項目1: 昨日やったこと（300文字ちょうど）
    const item1_300chars =
      "a".repeat(300);

    // 項目2: 今日やること（有効なテキスト）
    const item2 = "今日の予定は営業会議と報告書作成です";

    // 項目3: 抱えている課題（有効なテキスト）
    const item3 = "プロジェクトのスケジュール遅延が懸念事項です";

    // メール送信成功レスポンス
    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: "success",
        message: "メール送信完了",
      }),
      { status: 200 }
    );

    const result = submitDailyReport({
      userId: "ENG001",
      departmentId: "DEV",
      yesterday: item1_300chars,
      today: item2,
      issues: item3,
      submittedAt: new Date("2024-01-15T08:30:00Z"),
    });

    // バリデーション成功、送信処理が実行された
    expect(result.isValid).toBe(true);
    expect(result.submitted).toBe(true);
    expect(result.errorMessage).toBeUndefined();

    // メール送信がリクエストされたことを確認
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/mail/send"),
      expect.any(Object)
    );

    // リクエストボディ内容の検証
    const callArgs = fetchMock.mock.calls[0];
    const requestBody = JSON.parse(callArgs[1].body);
    expect(requestBody.userId).toBe("ENG001");
    expect(requestBody.yesterday.length).toBe(300);
    expect(requestBody.today).toBe(item2);
    expect(requestBody.issues).toBe(item3);
  });
});