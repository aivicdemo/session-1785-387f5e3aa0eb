import { formatReportsList } from '../../src/logic/it-1-br-1-1-1';

describe('日報統一フォーマット整形・表示機能', () => {
  // SCEN-241
  test('部員が0人（部長のみ）の状況で空の日報一覧が表示される', () => {
    // Arrange: 部長のみの状況でセットアップ
    const managerUserId = 'user_001';
    const departmentId = 'dept_001';
    const reportsList = [];
    
    // Act: 日報統一フォーマット整形・表示機能を実行
    const result = formatReportsList({
      reports: reportsList,
      departmentId: departmentId,
      viewerUserId: managerUserId,
    });

    // Assert: 空の日報一覧が正しい形式で返される
    expect(result.reports).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.isEmpty).toBe(true);
    expect(result.displayMessage).toMatch(/送信済み日報がありません/);
  });
});