import { authenticateUser } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-062
  test('ユーザーの権限情報が null のときエラーとなる', async () => {
    const user_id = 'user-001';
    const permissions = null;
    const roles = null;

    const result = await authenticateUser(user_id, permissions, roles);

    expect(result.success).toBe(false);
    expect(result.error_code).toBe(401);
    expect(result.error_message).toMatch(/権限情報/);
    expect(result.redirect_url).toBe('/login');
    expect(result.can_access_input_screen).toBe(false);
  });
});