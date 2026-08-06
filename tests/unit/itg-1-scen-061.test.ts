import { validateSessionExpiration } from "../../src/logic/it-1";

describe("日報入力フォームの提供と送信機能", () => {
  test("SCEN-061: ユーザー認証機能 - セッションの有効期限が切れているときエラーとなる", () => {
    const currentTime = new Date("2024-01-15T10:00:00Z").getTime();
    const expiredSessionId = "session_expired_001";
    const expiredAt = new Date("2024-01-15T09:00:00Z").getTime();

    const sessionStore = {
      [expiredSessionId]: {
        userId: "user_123",
        expiresAt: expiredAt,
        createdAt: new Date("2024-01-15T08:00:00Z").getTime(),
      },
    };

    expect(() =>
      validateSessionExpiration(expiredSessionId, sessionStore, currentTime)
    ).toThrow(/セッション有効期限/);
  });
});