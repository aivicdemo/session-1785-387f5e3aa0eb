import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';

describe('報告送信時に、送信者本人と部長宛に確認メールを自動配信する機能', () => {
  // SCEN-318
  test('年度をまたいで送信された日報が混在する時、全ての日報が時系列順に正確に集約される', async () => {
    const test_reports = [
      {
        report_id: 'R001',
        user_id: 'USER_A',
        submitted_at: new Date('2024-01-15T10:00:00Z'),
        yesterday_accomplishment: '機能Aのレビューを完了',
        today_plan: '機能Bの実装開始',
        current_issues: '外部APIの遅延あり'
      },
      {
        report_id: 'R002',
        user_id: 'USER_B',
        submitted_at: new Date('2023-12-20T09:30:00Z'),
        yesterday_accomplishment: '単体テスト実施',
        today_plan: 'バグ修正対応',
        current_issues: 'テスト環境が不安定'
      },
      {
        report_id: 'R003',
        user_id: 'USER_C',
        submitted_at: new Date('2024-01-16T08:45:00Z'),
        yesterday_accomplishment: 'ドキュメント作成',
        today_plan: '統合テスト準備',
        current_issues: 'リソース不足'
      },
      {
        report_id: 'R004',
        user_id: 'USER_D',
        submitted_at: new Date('2023-12-19T14:20:00Z'),
        yesterday_accomplishment: '設計レビュー実施',
        today_plan: 'コード実装開始',
        current_issues: '仕様が未決定'
      },
      {
        report_id: 'R005',
        user_id: 'USER_E',
        submitted_at: new Date('2024-01-15T11:15:00Z'),
        yesterday_accomplishment: 'パフォーマンス測定',
        today_plan: '最適化実装',
        current_issues: 'ボトルネック特定中'
      },
      {
        report_id: 'R006',
        user_id: 'USER_F',
        submitted_at: new Date('2023-12-21T10:00:00Z'),
        yesterday_accomplishment: 'セキュリティレビュー',
        today_plan: '脆弱性対応',
        current_issues: 'パッチ適用待ち'
      },
      {
        report_id: 'R007',
        user_id: 'USER_G',
        submitted_at: new Date('2024-01-16T09:30:00Z'),
        yesterday_accomplishment: 'ステージング検証',
        today_plan: '本番リリース準備',
        current_issues: 'ロールバック計画策定中'
      },
      {
        report_id: 'R008',
        user_id: 'USER_H',
        submitted_at: new Date('2023-12-20T14:45:00Z'),
        yesterday_accomplishment: 'インフラ構築',
        today_plan: 'モニタリング設定',
        current_issues: 'ディスク容量限界近し'
      },
      {
        report_id: 'R009',
        user_id: 'USER_I',
        submitted_at: new Date('2024-01-15T13:20:00Z'),
        yesterday_accomplishment: 'ユーザー調査実施',
        today_plan: '改善案提案',
        current_issues: 'フィードバック集約中'
      },
      {
        report_id: 'R010',
        user_id: 'USER_J',
        submitted_at: new Date('2023-12-19T09:00:00Z'),
        yesterday_accomplishment: 'プロジェクト計画策定',
        today_plan: 'チーム編成完了',
        current_issues: 'スケジュール調整中'
      }
    ];

    const aggregated_reports = await runTx2Imp1Agent({
      reports: test_reports,
      department_id: 'DEPT_DEV',
      manager_user_id: 'MGR_001',
      morning_meeting_start_time: new Date('2024-01-16T09:00:00Z')
    });

    const sorted_timestamps = aggregated_reports.map(r => r.submitted_at.getTime());
    const is_sorted_ascending = sorted_timestamps.every(
      (timestamp, index) => index === 0 || timestamp >= sorted_timestamps[index - 1]
    );
    expect(is_sorted_ascending).toBe(true);

    expect(aggregated_reports.length).toBe(10);

    const chronological_order = [
      new Date('2023-12-19T09:00:00Z'),
      new Date('2023-12-19T14:20:00Z'),
      new Date('2023-12-20T09:30:00Z'),
      new Date('2023-12-20T14:45:00Z'),
      new Date('2023-12-21T10:00:00Z'),
      new Date('2024-01-15T10:00:00Z'),
      new Date('2024-01-15T11:15:00Z'),
      new Date('2024-01-15T13:20:00Z'),
      new Date('2024-01-16T08:45:00Z'),
      new Date('2024-01-16T09:30:00Z')
    ];

    aggregated_reports.forEach((report, index) => {
      expect(report.submitted_at.getTime()).toBe(chronological_order[index].getTime());
    });

    const report_content_map = new Map(test_reports.map(r => [r.report_id, r]));

    aggregated_reports.forEach(aggregated_report => {
      const original_report = report_content_map.get(aggregated_report.report_id);
      expect(original_report).toBeDefined();
      expect(aggregated_report.yesterday_accomplishment).toBe(original_report!.yesterday_accomplishment);
      expect(aggregated_report.today_plan).toBe(original_report!.today_plan);
      expect(aggregated_report.current_issues).toBe(original_report!.current_issues);
      expect(aggregated_report.user_id).toBe(original_report!.user_id);
    });
  });
});