import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { checkAllEmployeesReportCompletion } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-350: [normal] 全員報告完了判定機能 - 10名中1名が未報告の場合、未報告者が催促対象として明示される
  it('should identify unreported employee when 1 out of 10 employees has not submitted report', () => {
    // Setup: テスト用データ
    const employees = [
      { employeeId: 'EMP001', name: '太郎' },
      { employeeId: 'EMP002', name: '花子' },
      { employeeId: 'EMP003', name: '次郎' },
      { employeeId: 'EMP004', name: '由美' },
      { employeeId: 'EMP005', name: '健一' },
      { employeeId: 'EMP006', name: '美咲' },
      { employeeId: 'EMP007', name: '翔太' },
      { employeeId: 'EMP008', name: '優子' },
      { employeeId: 'EMP009', name: '大輔' },
      { employeeId: 'EMP010', name: '由紀' },
    ];

    const reportedEmployeeIds = [
      'EMP001',
      'EMP002',
      'EMP003',
      'EMP004',
      'EMP005',
      'EMP006',
      'EMP007',
      'EMP008',
      'EMP009',
    ];

    const unreportedEmployeeIds = ['EMP010'];

    const reportedReports = [
      {
        reportId: 'REP001',
        employeeId: 'EMP001',
        yesterday: 'タスクA完了',
        today: 'タスクB開始',
        issue: 'なし',
        submittedAt: new Date('2024-01-15T08:00:00Z'),
      },
      {
        reportId: 'REP002',
        employeeId: 'EMP002',
        yesterday: 'タスクC完了',
        today: 'タスクD開始',
        issue: 'なし',
        submittedAt: new Date('2024-01-15T08:05:00Z'),
      },
      {
        reportId: 'REP003',
        employeeId: 'EMP003',
        yesterday: 'タスクE完了',
        today: 'タスクF開始',
        issue: 'なし',
        submittedAt: new Date('2024-01-15T08:10:00Z'),
      },
      {
        reportId: 'REP004',
        employeeId: 'EMP004',
        yesterday: 'タスクG完了',
        today: 'タスクH開始',
        issue: 'なし',
        submittedAt: new Date('2024-01-15T08:15:00Z'),
      },
      {
        reportId: 'REP005',
        employeeId: 'EMP005',
        yesterday: 'タスクI完了',
        today: 'タスクJ開始',
        issue: 'なし',
        submittedAt: new Date('2024-01-15T08:20:00Z'),
      },
      {
        reportId: 'REP006',
        employeeId: 'EMP006',
        yesterday: 'タスクK完了',
        today: 'タスクL開始',
        issue: 'なし',
        submittedAt: new Date('2024-01-15T08:25:00Z'),
      },
      {
        reportId: 'REP007',
        employeeId: 'EMP007',
        yesterday: 'タスクM完了',
        today: 'タスクN開始',
        issue: 'なし',
        submittedAt: new Date('2024-01-15T08:30:00Z'),
      },
      {
        reportId: 'REP008',
        employeeId: 'EMP008',
        yesterday: 'タスクO完了',
        today: 'タスクP開始',
        issue: 'なし',
        submittedAt: new Date('2024-01-15T08:35:00Z'),
      },
      {
        reportId: 'REP009',
        employeeId: 'EMP009',
        yesterday: 'タスクQ完了',
        today: 'タスクR開始',
        issue: 'なし',
        submittedAt: new Date('2024-01-15T08:40:00Z'),
      },
    ];

    // Execute: 全員報告完了判定機能を実行
    const result = checkAllEmployeesReportCompletion({
      employees: employees,
      reports: reportedReports,
      reportDate: new Date('2024-01-15'),
    });

    // Assert: 期待値を検証
    // 未報告者リストに1名のみ含まれることを確認
    expect(result.unreportedEmployees).toHaveLength(1);
    
    // 未報告者がEMP010であることを確認
    expect(result.unreportedEmployees[0].employeeId).toBe('EMP010');
    expect(result.unreportedEmployees[0].name).toBe('由紀');

    // 報告ステータスが『未報告あり』であることを確認
    expect(result.completionStatus).toBe('INCOMPLETE');

    // 報告完了数が9名であることを確認
    expect(result.reportedCount).toBe(9);

    // 未報告数が1名であることを確認
    expect(result.unreportedCount).toBe(1);

    // 全員報告が完了していないことを確認
    expect(result.isAllReported).toBe(false);
  });
});