import { authenticateUser } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  test("SCEN-058: ユーザーID が null のときエラーとなる", () => {
    expect(() => authenticateUser(null)).toThrow(/ユーザーID/);
  });
});