import { describe, test, expect, beforeEach } from '@jest/globals';
import { validateUserInDepartment } from '../../src/logic/it-1-br-1-1-1';

describe('報告送信時の確認メール自動配信 - ユーザー検証', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-465
  test('指定部門に存在しないユーザーIDでエラーが返却される', () => {
    const invalid_user_id = 'USER_99999';
    const target_department_id = 'DEPT_001';

    expect(() =>
      validateUserInDepartment({
        user_id: invalid_user_id,
        department_id: target_department_id,
      })
    ).toThrow(/ユーザーID/);
  });
});