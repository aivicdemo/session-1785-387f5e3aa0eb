import { validateAndApproveReport } from '../../src/logic/it-1-br-1-1-1';

describe('朝会報告内容検証・集約機能', () => {
  test('SCEN-477: 3項目すべてが記入されている報告1件が正常フォーマットとして承認される', () => {
    // ARRANGE
    const report = {
      id: 'report-001',
      userId: 'user-001',
      departmentId: 'dept-001',
      yesterday: 'タスクA完了',
      today: 'タスクB開始',
      challenges: 'リソース不足',
      status: 'pending',
      errorMessage: null,
      submittedAt: new Date('2024-01-15T08:00:00Z'),
    };

    // ACT
    const result = validateAndApproveReport(report);

    // ASSERT
    expect(result).toBe(true);
    expect(report.status).toBe('approved');
    expect(report.errorMessage).toBeNull();
  });
});