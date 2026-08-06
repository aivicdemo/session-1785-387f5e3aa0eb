import { validateUserAuthorities } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-063
  test('ユーザーの権限情報が空配列のときエラーとなる', () => {
    const user = {
      userId: 'user_001',
      username: 'engineer_tanaka',
      email: 'tanaka@company.com',
      authorities: [],
    };

    expect(() => validateUserAuthorities(user)).toThrow(/権限情報/);
  });
});