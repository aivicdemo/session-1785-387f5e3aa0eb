import { authenticateUser } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-059
  test("ユーザーID が空文字のときエラーとなる", () => {
    const emptyUserID = "";
    const password = "validPassword123";

    expect(() => authenticateUser(emptyUserID, password)).toThrow(
      /USER_ID_EMPTY|ユーザーIDが入力されていません/
    );
  });
});