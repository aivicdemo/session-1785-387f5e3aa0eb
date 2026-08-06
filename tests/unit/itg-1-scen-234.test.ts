import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendConfirmationEmailToDeptHead } from '../../src/logic/it-1-br-1-1-1';

describe('日報統一フォーマット整形・表示機能 - 部門所属検証', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-234
  test('送信者が指定部門に属していない場合、エラーが発生する', async () => {
    const managerUserId = 'manager_001';
    const memberUserId = 'member_001';
    const deptA = 'dept_A';
    const deptB = 'dept_B';

    const reportData = {
      userId: memberUserId,
      departmentId: deptB,
      yesterdayAccomplishment: 'タスクA完了',
      todayPlan: 'タスクB開始',
      currentIssue: 'リソース不足',
      reportedAtISO: '2024-01-15T08:30:00Z',
      targetDepartmentId: deptB,
      targetManagerUserId: managerUserId,
      targetManagerDepartmentId: deptA,
    };

    expect(() =>
      sendConfirmationEmailToDeptHead(reportData)
    ).toThrow(/部門/);
  });
});