import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import {
  extractPriorityRemindTargets,
} from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-320
  test('催促対象部員の優先順位付け機能 - 未送信部員のみが存在する場合、全員が催促対象として抽出される', () => {
    const employee_count = 10;
    const employees = Array.from({ length: employee_count }, (_, i) => ({
      user_id: `user_${i + 1}`,
      department_id: 'dev_dept_1',
      user_name: `Engineer_${i + 1}`,
    }));

    const report_status_all_unsent = employees.map((emp) => ({
      user_id: emp.user_id,
      report_date: '2024-01-15',
      submission_status: 'unsent' as const,
      submitted_at: null,
    }));

    const target_list = extractPriorityRemindTargets({
      employees,
      report_statuses: report_status_all_unsent,
      morning_assembly_time: new Date('2024-01-15T09:00:00Z'),
    });

    expect(target_list.length).toBe(10);
    expect(
      target_list.map((t) => t.user_id).sort()
    ).toEqual(
      employees.map((e) => e.user_id).sort()
    );

    const unique_user_ids = new Set(target_list.map((t) => t.user_id));
    expect(unique_user_ids.size).toBe(10);

    target_list.forEach((target) => {
      expect(target.priority_rank).toBe(1);
    });
  });
});