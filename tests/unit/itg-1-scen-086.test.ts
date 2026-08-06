import { validateSessionExpiration } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-086
  test('セッション有効期限満了の1秒後のアクセスで認証情報入力画面に遷移する', () => {
    // 前置条件: セッション有効期限を30分（1800秒）に設定
    const session_lifetime_seconds = 1800;
    
    // テスト用ユーザーアカウント（部員）でログイン処理を実行してセッションを確立
    const login_timestamp_iso = '2024-01-15T09:00:00Z';
    const login_timestamp = new Date(login_timestamp_iso).getTime();
    
    // セッション確立時刻から1800秒経過後、システム時刻を1801秒進める（有効期限満了の1秒後）
    const elapsed_seconds_after_expiry = 1801;
    const current_timestamp = login_timestamp + elapsed_seconds_after_expiry * 1000;
    const current_timestamp_iso = new Date(current_timestamp).toISOString();
    
    // セッション確立後1801秒経過した状態で、朝会報告管理システムの任意のページにアクセス
    const input = {
      session_login_time: login_timestamp_iso,
      session_lifetime_seconds: session_lifetime_seconds,
      access_time: current_timestamp_iso,
    };
    
    // 期待結果: セッション有効期限満了の1秒後のアクセスに対して、
    // セッション無効による処理フローにより認証情報入力画面にリダイレクト
    const result = validateSessionExpiration(input);
    
    expect(result.is_session_valid).toBe(false);
    expect(result.redirect_target).toBe('/login');
    expect(result.error_message).toMatch(/セッション/);
    expect(result.session_cookie_state).toBe('invalidated');
  });
});