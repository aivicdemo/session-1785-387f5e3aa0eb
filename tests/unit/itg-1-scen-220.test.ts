import { formatDailyReportsList } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-220
  test('日報統一フォーマット整形・表示機能 - 部員複数名の日報が統一フォーマット（昨日やったこと・今日やること・抱えている課題）で整形される', () => {
    const employee_a_report = {
      employee_id: 'EMP001',
      employee_name: 'employee_a',
      yesterday_achievement: '顧客A社との打ち合わせ',
      today_plan: '提案資料作成',
      current_issue: 'リソース不足',
    };

    const employee_b_report = {
      employee_id: 'EMP002',
      employee_name: 'employee_b',
      yesterday_achievement: 'システム改修テスト',
      today_plan: 'バグ修正',
      current_issue: '要件不明確',
    };

    const employee_c_report = {
      employee_id: 'EMP003',
      employee_name: 'employee_c',
      yesterday_achievement: '営業活動',
      today_plan: '受注フォロー',
      current_issue: '無し',
    };

    const reports_list = [employee_a_report, employee_b_report, employee_c_report];

    const formatted_result = formatDailyReportsList(reports_list);

    expect(formatted_result).toEqual({
      total_count: 3,
      reports: [
        {
          employee_id: 'EMP001',
          employee_name: 'employee_a',
          yesterday_achievement: '顧客A社との打ち合わせ',
          today_plan: '提案資料作成',
          current_issue: 'リソース不足',
        },
        {
          employee_id: 'EMP002',
          employee_name: 'employee_b',
          yesterday_achievement: 'システム改修テスト',
          today_plan: 'バグ修正',
          current_issue: '要件不明確',
        },
        {
          employee_id: 'EMP003',
          employee_name: 'employee_c',
          yesterday_achievement: '営業活動',
          today_plan: '受注フォロー',
          current_issue: '無し',
        },
      ],
    });

    expect(formatted_result.total_count).toBe(3);
    expect(formatted_result.reports.length).toBe(3);
    expect(formatted_result.reports[0].yesterday_achievement).toBe('顧客A社との打ち合わせ');
    expect(formatted_result.reports[0].today_plan).toBe('提案資料作成');
    expect(formatted_result.reports[0].current_issue).toBe('リソース不足');
    expect(formatted_result.reports[1].yesterday_achievement).toBe('システム改修テスト');
    expect(formatted_result.reports[1].today_plan).toBe('バグ修正');
    expect(formatted_result.reports[1].current_issue).toBe('要件不明確');
    expect(formatted_result.reports[2].yesterday_achievement).toBe('営業活動');
    expect(formatted_result.reports[2].today_plan).toBe('受注フォロー');
    expect(formatted_result.reports[2].current_issue).toBe('無し');
  });
});