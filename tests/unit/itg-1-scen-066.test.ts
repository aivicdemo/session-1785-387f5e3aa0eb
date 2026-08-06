import { authenticateUser } from '../../src/logic/it-1';

describe('ユーザー認証機能 - 所属部門情報の検証', () => {
  test('SCEN-066: ユーザーが所属する部門情報が空文字のときエラーとなる', () => {
    const user_info = {
      user_id: 'eng001',
      user_name: 'Test Engineer',
      department_id: '',
      email: 'engineer@example.com',
      role: 'engineer',
    };

    expect(() => authenticateUser(user_info)).toThrow(/部門情報/);
  });
});