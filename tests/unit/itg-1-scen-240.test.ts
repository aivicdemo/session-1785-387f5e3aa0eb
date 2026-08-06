import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

describe('日報統一フォーマット整形・表示機能 - ページネーション境界分割', () => {
  // SCEN-240
  test('部員数が確認可能上限数を超過した場合にページネーション境界で正しく分割される', async () => {
    // セットアップ: モックサーバー初期化
    const fetchMock = require('jest-fetch-mock');
    fetchMock.enableMocks();
    fetchMock.resetMocks();

    // 部員データ11件を準備（上限10名を超過）
    const mock_employee_data = Array.from({ length: 11 }, (_, idx) => ({
      id: `emp_${String(idx + 1).padStart(2, '0')}`,
      name: `エンジニア${idx + 1}`,
      department_id: 'dept_dev',
      report_status: idx < 10 ? 'submitted' : 'pending',
      submitted_at: idx < 10 ? new Date('2024-01-15T08:00:00Z').toISOString() : null,
    }));

    // Mock: 部員一覧取得エンドポイント
    fetchMock.mockResponseOnce(JSON.stringify({
      data: mock_employee_data,
      total: 11,
    }), { status: 200 });

    // 動的import: src/logic/it-1-br-1-1-1から機能をインポート
    const { formatReportListWithPagination } = await import('../../src/logic/it-1-br-1-1-1');

    // 第1ページ（displayLimit=10）をロード
    const page1_result = await formatReportListWithPagination({
      employees: mock_employee_data,
      current_page: 1,
      display_limit: 10,
    });

    // 第1ページの検証
    expect(page1_result.current_page).toBe(1);
    expect(page1_result.total_items).toBe(11);
    expect(page1_result.total_pages).toBe(2);
    expect(page1_result.items_in_page).toBe(10);
    expect(page1_result.items.length).toBe(10);
    expect(page1_result.items[0].id).toBe('emp_01');
    expect(page1_result.items[9].id).toBe('emp_10');
    expect(page1_result.has_next_page).toBe(true);
    expect(page1_result.has_previous_page).toBe(false);

    // 第2ページへ遷移
    const page2_result = await formatReportListWithPagination({
      employees: mock_employee_data,
      current_page: 2,
      display_limit: 10,
    });

    // 第2ページの検証（11件目のみ）
    expect(page2_result.current_page).toBe(2);
    expect(page2_result.total_items).toBe(11);
    expect(page2_result.total_pages).toBe(2);
    expect(page2_result.items_in_page).toBe(1);
    expect(page2_result.items.length).toBe(1);
    expect(page2_result.items[0].id).toBe('emp_11');
    expect(page2_result.items[0].report_status).toBe('pending');
    expect(page2_result.has_next_page).toBe(false);
    expect(page2_result.has_previous_page).toBe(true);

    // 第1ページへ戻る検証
    const page1_return = await formatReportListWithPagination({
      employees: mock_employee_data,
      current_page: 1,
      display_limit: 10,
    });

    // 第1ページに1～10件目が再度表示されることを確認
    expect(page1_return.current_page).toBe(1);
    expect(page1_return.items.length).toBe(10);
    expect(page1_return.items[0].id).toBe('emp_01');
    expect(page1_return.items[9].id).toBe('emp_10');
    expect(page1_return.items.every((item: any, idx: number) => item.id === `emp_${String(idx + 1).padStart(2, '0')}`)).toBe(true);

    // ページ間のデータ重複・欠落がないことを確認
    const all_page1_ids = page1_return.items.map((item: any) => item.id);
    const all_page2_ids = page2_result.items.map((item: any) => item.id);
    const combined_ids = [...all_page1_ids, ...all_page2_ids];
    const unique_ids = new Set(combined_ids);
    expect(unique_ids.size).toBe(11);
    expect(combined_ids.length).toBe(11);

    fetchMock.disableMocks();
  });
});