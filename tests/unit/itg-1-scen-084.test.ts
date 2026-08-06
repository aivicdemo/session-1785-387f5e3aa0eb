import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { validateSessionAndRedirect } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  // SCEN-084: [edge] 認証・セッション管理機能 - セッション有効期限がちょうど満了した時点でのアクセスで認証情報入力画面に遷移する
  it("should redirect to login and clear session when session expiry time equals current time exactly", () => {
    // Arrange
    const current_time_utc = new Date("2024-01-15T09:00:00Z");
    const session_expiry_time_utc = new Date("2024-01-15T09:00:00Z");
    const user_id = "user_12345";
    const session_id = "sess_abcde";

    const session_data = {
      session_id: session_id,
      user_id: user_id,
      created_at: new Date("2024-01-15T08:00:00Z"),
      expires_at: session_expiry_time_utc,
    };

    const mock_get_current_time = jest.fn(() => current_time_utc);
    const mock_clear_session = jest.fn(() => ({ cleared: true }));
    const mock_get_session = jest.fn(() => session_data);

    // Act
    const result = validateSessionAndRedirect({
      session_id: session_id,
      requested_path: "/report",
      current_time_fn: mock_get_current_time,
      get_session_fn: mock_get_session,
      clear_session_fn: mock_clear_session,
    });

    // Assert
    expect(result.is_authenticated).toBe(false);
    expect(result.redirect_url).toBe("/login");
    expect(result.session_cleared).toBe(true);
    expect(result.message).toBe(
      "セッションの有効期限が切れました。再度ログインしてください。"
    );
    expect(mock_get_current_time).toHaveBeenCalled();
    expect(mock_get_session).toHaveBeenCalledWith(session_id);
    expect(mock_clear_session).toHaveBeenCalledWith(session_id);
  });
});