import { validateReportSubmission } from '../../src/logic/it-1';

describe('朝会報告入力フォームの提供と送信機能', () => {
  // SCEN-489
  test('報告者が部長自身である場合にバリデーションエラーが発生する', () => {
    const managerUserId = 'user_manager_001';
    const reportData = {
      userId: managerUserId,
      reporterUserId: managerUserId,
      departmentId: 'dept_dev_001',
      yesterdayAccomplishment: 'A案件のコード確認',
      todayPlan: 'B案件の実装',
      challenge: '納期調整が必要',
      userRole: 'manager',
      submittedAt: new Date('2024-01-15T08:30:00Z'),
    };

    expect(() => validateReportSubmission(reportData)).toThrow(/部長/);
  });
});