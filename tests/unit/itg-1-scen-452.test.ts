import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { getReportArrivalStatus } from '../../src/logic/it-1-br-1-1-1';

describe('報告到着状況把握機能 - 部門IDが空文字列のとき、エラーになる', () => {
  // SCEN-452
  test('部門IDが空文字列のとき、エラーオブジェクトが返される', () => {
    const departmentId = '';
    
    const result = getReportArrivalStatus(departmentId);
    
    expect(result).toEqual({
      code: 'INVALID_DEPARTMENT_ID',
      message: '部門IDは必須項目です'
    });
  });
});