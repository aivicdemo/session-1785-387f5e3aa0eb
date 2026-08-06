import { validateSession } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-087: [edge] 認証・セッション管理機能 - セッショントークンが空文字列の場合、認証情報入力画面に遷移する
  test("セッショントークンが空文字列のとき、セッション検証がFAILEDを返し401ステータスを含むエラーを発生させる", () => {
    const emptySessionToken = "";

    const result = validateSession({
      sessionToken: emptySessionToken,
    });

    expect(result).toEqual({
      isValid: false,
      status: 401,
      redirectUrl: "/login",
      message: "セッション無効",
    });
  });
});