import { describe, test, expect } from '@jest/globals';
import { formatAndDisplayUnifiedReports } from '../../src/logic/it-1-br-1-1-1';

describe('日報統一フォーマット整形・表示機能', () => {
  // SCEN-243
  test('同一部員から重複する日報が含まれている場合に重複を排除して表示される', () => {
    const duplicate_report_input = [
      {
        employee_id: 'tanaka_taro_001',
        employee_name: '田中太郎',
        department_id: 'dev_001',
        department_name: '開発部',
        yesterday_achievement: '会議資料作成',
        today_plan: 'プレゼン準備',
        issues: 'スライド未完成',
        submitted_at: new Date('2024-01-15T08:30:00Z'),
      },
      {
        employee_id: 'tanaka_taro_001',
        employee_name: '田中太郎',
        department_id: 'dev_001',
        department_name: '開発部',
        yesterday_achievement: '会議資料作成',
        today_plan: 'プレゼン準備',
        issues: 'スライド未完成',
        submitted_at: new Date('2024-01-15T08:30:00Z'),
      },
    ];

    const formatted_result = formatAndDisplayUnifiedReports(duplicate_report_input);

    expect(formatted_result).toEqual({
      total_unique_reports: 1,
      reports_by_employee: [
        {
          employee_id: 'tanaka_taro_001',
          employee_name: '田中太郎',
          department_id: 'dev_001',
          department_name: '開発部',
          report_count: 1,
          reports: [
            {
              yesterday_achievement: '会議資料作成',
              today_plan: 'プレゼン準備',
              issues: 'スライド未完成',
              submitted_at: new Date('2024-01-15T08:30:00Z'),
            },
          ],
        },
      ],
    });

    expect(formatted_result.total_unique_reports).toBe(1);
    expect(formatted_result.reports_by_employee[0].report_count).toBe(1);
    expect(formatted_result.reports_by_employee[0].reports.length).toBe(1);
    expect(formatted_result.reports_by_employee[0].reports[0].yesterday_achievement).toBe(
      '会議資料作成',
    );
    expect(formatted_result.reports_by_employee[0].reports[0].today_plan).toBe('プレゼン準備');
    expect(formatted_result.reports_by_employee[0].reports[0].issues).toBe('スライド未完成');
  });
});