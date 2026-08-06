import { validateSessionAndProvideForm } from "../../src/logic/it-1";

describe("朝会報告管理システム - 日報入力フォーム提供と認証", () => {
  // SCEN-088: [edge] 認証・セッション管理機能 - セッション情報を持たない初回アクセス時に認証情報入力画面に遷移する
  test("should display authentication form when no session exists on initial access", () => {
    // Precondition: ブラウザのキャッシュとクッキーをクリアした状態でテストを開始
    const sessionStorage_before = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("session_token") : null;
    const localStorage_before = typeof localStorage !== "undefined" ? localStorage.getItem("auth_session") : null;

    // Trigger: 朝会報告管理システムのログインページのURLに直接アクセス（セッション情報なし）
    const access_timestamp = "2024-01-15T07:30:00Z";
    const session_token = null;
    const auth_header = null;

    // Action: validateSessionAndProvideForm を呼び出す
    const result = validateSessionAndProvideForm({
      session_token: session_token,
      auth_header: auth_header,
      access_timestamp: access_timestamp,
    });

    // Outcome: 認証情報入力画面（ログインフォーム）が表示される
    expect(result.requires_authentication).toBe(true);
    expect(result.form_type).toBe("login");

    // 画面には以下の要素が含まれること
    expect(result.form_fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_name: "user_id",
          field_type: "text",
          is_required: true,
        }),
        expect.objectContaining({
          field_name: "password",
          field_type: "password",
          is_required: true,
        }),
        expect.objectContaining({
          field_name: "login_button",
          field_type: "submit",
          is_required: true,
        }),
      ])
    );

    // セッション情報が無いため認可ヘッダーが送信されず
    expect(result.authorization_header_required).toBe(true);
    expect(result.session_is_valid).toBe(false);

    // ユーザーは認証が必要な状態にある
    expect(result.authentication_status).toBe("required");
    expect(result.can_access_form).toBe(false);
  });
});