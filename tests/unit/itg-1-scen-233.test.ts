import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { formatAndDisplayUnifiedReport } from '../../src/logic/it-1-br-1-1-1';

describe('日報統一フォーマット整形・表示機能', () => {
  // SCEN-233
  test('部門情報が欠けている場合、エラーが発生する', () => {
    const incompleteReportData = {
      yesterday_achievement: '昨日完了したタスクの詳細',
      today_plan: '本日予定しているタスク',
      current_challenges: '現在抱えている課題',
      department_info: undefined,
    };

    expect(() => {
      formatAndDisplayUnifiedReport(incompleteReportData);
    }).toThrow(/部門情報/);
  });
});