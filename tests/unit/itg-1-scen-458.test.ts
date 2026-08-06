import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

describe('報告送信時の確認メール自動配信機能', () => {
  // SCEN-458: [error] 報告到着状況把握機能 - 部長ユーザーIDが空文字列のとき、エラーになる
  test('部長ユーザーIDが空文字列の場合、エラーをスローする', async () => {
    const { initializeReportStatusMonitor } = await import(
      '../../src/logic/it-1-br-1-1-1'
    );

    const invalid_manager_user_id = '';
    const valid_department_id = 'DEPT-001';
    const valid_monitoring_start_time = new Date('2024-01-15T08:00:00Z');

    expect(() => {
      initializeReportStatusMonitor({
        manager_user_id: invalid_manager_user_id,
        department_id: valid_department_id,
        monitoring_start_time: valid_monitoring_start_time,
      });
    }).toThrow(/部長ユーザーID/);
  });
});