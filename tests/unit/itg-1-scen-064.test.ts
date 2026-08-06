import { authenticateUser } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-064
  test('ユーザー認証機能 - ユーザーレコードがデータベースに存在しないときエラーとなる', async () => {
    const nonExistentUserId = 'user_99999';

    expect(() => authenticateUser(nonExistentUserId)).toThrow(/ユーザー/);
  });
});