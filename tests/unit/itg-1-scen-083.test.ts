import { sendConfirmationEmail } from "../../src/logic/it-2";

describe("確認メール自動配信機能", () => {
  test("SCEN-083: 送信者の部門情報が空文字のときエラーとなる", () => {
    const sender_info = {
      user_id: "ENG001",
      name: "田中太郎",
      email: "tanaka@example.com",
      department: "",
      role: "engineer",
    };

    expect(() => sendConfirmationEmail(sender_info)).toThrow(/部門情報/);
  });
});