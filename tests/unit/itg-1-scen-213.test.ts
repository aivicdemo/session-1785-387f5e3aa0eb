import { describe, test, expect, beforeEach } from '@jest/globals';
import { judgeReportingStatus } from '../../src/logic/it-1';

describe('日報送信状況判定機能', () => {
  // SCEN-213
  test('同一部門内に重複したユーザーIDが送信履歴に存在する場合、重複を除外して判定される', () => {
    const submission_history = [
      {
        user_id: 'user_A',
        department_id: 'sales_dept',
        submitted_at: new Date('2024-01-15T08:30:00Z'),
        yesterday_accomplishment: '顧客A社との契約締結',
        today_plan: '顧客B社のプレゼン実施',
        current_issues: '契約書の修正対応'
      },
      {
        user_id: 'user_B',
        department_id: 'sales_dept',
        submitted_at: new Date('2024-01-15T08:45:00Z'),
        yesterday_accomplishment: '見積書3件提出',
        today_plan: 'フォローアップ電話',
        current_issues: '予算承認の遅延'
      },
      {
        user_id: 'user_A',
        department_id: 'sales_dept',
        submitted_at: new Date('2024-01-15T09:00:00Z'),
        yesterday_accomplishment: '顧客C社との打ち合わせ',
        today_plan: '資料作成',
        current_issues: 'リソース不足'
      }
    ];

    const result = judgeReportingStatus(submission_history);

    expect(result).toEqual({
      department_id: 'sales_dept',
      unique_submitter_count: 2,
      summary: '営業部：2名が日報を送信済み'
    });
  });
});