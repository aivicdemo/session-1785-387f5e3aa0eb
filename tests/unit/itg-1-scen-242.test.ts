import { formatAndSortReports } from '../../src/logic/it-1-br-1-1-1';

describe('日報統一フォーマット整形・表示機能', () => {
  // SCEN-242
  test('複数部員の日報が送信順序と逆順で整列される場合に正しい順序に並び替えられる', () => {
    fetchMock.resetMocks();

    const report_a = {
      user_id: 'user_a',
      user_name: '部員A',
      yesterday_achievement: 'タスクX完了',
      today_plan: 'タスクY開始',
      issues: '',
      submitted_at: new Date('2024-01-15T08:30:00Z'),
    };

    const report_b = {
      user_id: 'user_b',
      user_name: '部員B',
      yesterday_achievement: 'タスクZ完了',
      today_plan: 'タスクW開始',
      issues: 'リソース不足',
      submitted_at: new Date('2024-01-15T08:20:00Z'),
    };

    const report_c = {
      user_id: 'user_c',
      user_name: '部員C',
      yesterday_achievement: 'タスクV完了',
      today_plan: 'タスクU開始',
      issues: '',
      submitted_at: new Date('2024-01-15T08:10:00Z'),
    };

    const reports_reversed_order = [report_c, report_b, report_a];

    const result = formatAndSortReports(reports_reversed_order);

    expect(result).toHaveLength(3);
    expect(result[0].user_id).toBe('user_a');
    expect(result[0].user_name).toBe('部員A');
    expect(result[0].yesterday_achievement).toBe('タスクX完了');
    expect(result[0].today_plan).toBe('タスクY開始');
    expect(result[0].issues).toBe('');

    expect(result[1].user_id).toBe('user_b');
    expect(result[1].user_name).toBe('部員B');
    expect(result[1].yesterday_achievement).toBe('タスクZ完了');
    expect(result[1].today_plan).toBe('タスクW開始');
    expect(result[1].issues).toBe('リソース不足');

    expect(result[2].user_id).toBe('user_c');
    expect(result[2].user_name).toBe('部員C');
    expect(result[2].yesterday_achievement).toBe('タスクV完了');
    expect(result[2].today_plan).toBe('タスクU開始');
    expect(result[2].issues).toBe('');
  });
});