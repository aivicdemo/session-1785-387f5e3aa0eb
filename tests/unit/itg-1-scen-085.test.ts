import { validateSessionAndGetInputForm } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-085: [edge] 認証・セッション管理機能 - セッション有効期限満了の1秒前のアクセスで入力画面へ直接遷移する
  test('セッション有効期限満了の1秒前のアクセスで入力画面へ直接遷移する', () => {
    const session_ttl_seconds = 3600;
    const login_timestamp_iso = '2024-01-15T09:00:00Z';
    const login_timestamp_ms = new Date(login_timestamp_iso).getTime();
    const access_timestamp_iso = '2024-01-15T09:59:59Z';
    const access_timestamp_ms = new Date(access_timestamp_iso).getTime();
    const elapsed_seconds = (access_timestamp_ms - login_timestamp_ms) / 1000;

    const session_state = {
      user_id: 'engineer_001',
      login_timestamp: login_timestamp_iso,
      session_ttl_seconds: session_ttl_seconds,
      is_authenticated: true,
    };

    const access_input = {
      session_state: session_state,
      current_timestamp: access_timestamp_iso,
    };

    const result = validateSessionAndGetInputForm(access_input);

    expect(result.is_session_valid).toBe(true);
    expect(result.should_redirect_to_login).toBe(false);
    expect(result.form_fields).toEqual([
      '昨日やったこと',
      '今日やること',
      '抱えている課題',
    ]);
    expect(result.elapsed_seconds).toBe(3599);
    expect(result.remaining_seconds).toBe(1);
  });
});