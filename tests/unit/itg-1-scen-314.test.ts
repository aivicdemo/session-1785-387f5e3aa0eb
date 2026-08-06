import { aggregateDailyReportsWithTimestampSort } from '../../src/logic/it-1-br-1-1-1';

describe('確認メール配信・日報一覧集約機能', () => {
  // SCEN-314
  test('送信済み部員リストの順序が送信時刻の逆順の時、正しい時系列順に日報が集約される', () => {
    // Arrange: テストデータとして、3名の部員の日報送信記録を生成
    // 送信時刻: 部員C=09:05、部員B=09:10、部員A=09:15
    // 入力リストは意図的に逆順（部員A→部員B→部員C）に配置
    const reportC = {
      employee_id: 'EMP003',
      employee_name: '部員C',
      submitted_at: new Date('2024-01-15T09:05:00Z'),
      yesterday_achievement: '昨日のタスクC完了',
      today_plan: '本日のタスクC開始',
      issue: '課題なし',
    };

    const reportB = {
      employee_id: 'EMP002',
      employee_name: '部員B',
      submitted_at: new Date('2024-01-15T09:10:00Z'),
      yesterday_achievement: '昨日のタスクB完了',
      today_plan: '本日のタスクB開始',
      issue: '軽微な懸念事項',
    };

    const reportA = {
      employee_id: 'EMP001',
      employee_name: '部員A',
      submitted_at: new Date('2024-01-15T09:15:00Z'),
      yesterday_achievement: '昨日のタスクA完了',
      today_plan: '本日のタスクA開始',
      issue: 'リソース不足',
    };

    // 逆順で入力
    const submitted_reports_reversed = [reportA, reportB, reportC];

    // Act: 日報一覧集約処理を実行
    const aggregated_result = aggregateDailyReportsWithTimestampSort(
      submitted_reports_reversed,
    );

    // Assert: 返された日報一覧が送信時刻の昇順で並んでいることを検証
    expect(aggregated_result).toHaveLength(3);

    // インデックス0: 部員C（09:05:00）
    expect(aggregated_result[0].employee_id).toBe('EMP003');
    expect(aggregated_result[0].employee_name).toBe('部員C');
    expect(aggregated_result[0].submitted_at).toEqual(
      new Date('2024-01-15T09:05:00Z'),
    );
    expect(aggregated_result[0].yesterday_achievement).toBe('昨日のタスクC完了');
    expect(aggregated_result[0].today_plan).toBe('本日のタスクC開始');
    expect(aggregated_result[0].issue).toBe('課題なし');

    // インデックス1: 部員B（09:10:00）
    expect(aggregated_result[1].employee_id).toBe('EMP002');
    expect(aggregated_result[1].employee_name).toBe('部員B');
    expect(aggregated_result[1].submitted_at).toEqual(
      new Date('2024-01-15T09:10:00Z'),
    );
    expect(aggregated_result[1].yesterday_achievement).toBe('昨日のタスクB完了');
    expect(aggregated_result[1].today_plan).toBe('本日のタスクB開始');
    expect(aggregated_result[1].issue).toBe('軽微な懸念事項');

    // インデックス2: 部員A（09:15:00）
    expect(aggregated_result[2].employee_id).toBe('EMP001');
    expect(aggregated_result[2].employee_name).toBe('部員A');
    expect(aggregated_result[2].submitted_at).toEqual(
      new Date('2024-01-15T09:15:00Z'),
    );
    expect(aggregated_result[2].yesterday_achievement).toBe('昨日のタスクA完了');
    expect(aggregated_result[2].today_plan).toBe('本日のタスクA開始');
    expect(aggregated_result[2].issue).toBe('リソース不足');

    // 各レコードのタイムスタンプが正確に保持されていることを追加検証
    expect(aggregated_result[0].submitted_at.getTime()).toBe(
      new Date('2024-01-15T09:05:00Z').getTime(),
    );
    expect(aggregated_result[1].submitted_at.getTime()).toBe(
      new Date('2024-01-15T09:10:00Z').getTime(),
    );
    expect(aggregated_result[2].submitted_at.getTime()).toBe(
      new Date('2024-01-15T09:15:00Z').getTime(),
    );
  });
});