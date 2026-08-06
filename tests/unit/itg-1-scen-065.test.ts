import { describe, test, expect } from '@jest/globals';
import { validateUserAuthentication } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-065
  test('ユーザーが所属部門情報がnullのときエラーとなる', () => {
    const user_with_null_department = {
      userId: 'USR001',
      userName: 'engineer_name',
      email: 'engineer@example.com',
      departmentId: null,
      department: null,
      role: 'engineer',
      isActive: true,
    };

    expect(() => validateUserAuthentication(user_with_null_department)).toThrow(
      /所属部門/
    );
  });
});