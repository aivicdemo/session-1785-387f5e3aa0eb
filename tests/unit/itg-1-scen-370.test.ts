import { validateAllReportsReceived } from '../../src/logic/it-1-br-1-1-1';

describe('報告送信時に、送信者本人と部長宛に確認メールを自動配信する機能', () => {
  // SCEN-370: [edge] 全員報告完了判定機能 - 同一ユーザーからの重複報告が含まれる場合、実報告者数が正しく集計される
  test('同一ユーザーからの重複報告が含まれる場合、実報告者数が正しく集計される', () => {
    const timestamp1 = new Date('2024-01-15T08:00:00Z');
    const timestamp2 = new Date('2024-01-15T08:05:00Z');
    const timestamp3 = new Date('2024-01-15T08:10:00Z');
    const timestamp4 = new Date('2024-01-15T08:15:00Z');
    const timestamp5 = new Date('2024-01-15T08:20:00Z');
    const timestamp6 = new Date('2024-01-15T08:25:00Z');
    const timestamp7 = new Date('2024-01-15T08:30:00Z');
    const timestamp8 = new Date('2024-01-15T08:35:00Z');
    const timestamp9 = new Date('2024-01-15T08:40:00Z');
    const timestamp10 = new Date('2024-01-15T08:45:00Z');
    const timestamp11 = new Date('2024-01-15T08:50:00Z');

    const reports = [
      {
        report_id: 'report_001',
        user_id: 'user_001',
        department_id: 'dept_dev',
        yesterday_achievement: '機能A実装',
        today_plan: '機能Bレビュー',
        current_issues: 'なし',
        sent_at: timestamp1,
      },
      {
        report_id: 'report_002',
        user_id: 'user_001',
        department_id: 'dept_dev',
        yesterday_achievement: '機能A実装（更新）',
        today_plan: '機能Bレビュー（更新）',
        current_issues: 'DB接続遅延',
        sent_at: timestamp2,
      },
      {
        report_id: 'report_003',
        user_id: 'user_001',
        department_id: 'dept_dev',
        yesterday_achievement: '機能A実装完了',
        today_plan: '機能Bレビュー完了',
        current_issues: 'DB接続遅延解決',
        sent_at: timestamp3,
      },
      {
        report_id: 'report_004',
        user_id: 'user_002',
        department_id: 'dept_dev',
        yesterday_achievement: '単体テスト完了',
        today_plan: '統合テスト',
        current_issues: 'なし',
        sent_at: timestamp4,
      },
      {
        report_id: 'report_005',
        user_id: 'user_003',
        department_id: 'dept_dev',
        yesterday_achievement: 'デザイン確認',
        today_plan: 'UI実装',
        current_issues: 'なし',
        sent_at: timestamp5,
      },
      {
        report_id: 'report_006',
        user_id: 'user_004',
        department_id: 'dept_dev',
        yesterday_achievement: 'ドキュメント作成',
        today_plan: 'レビュー対応',
        current_issues: 'なし',
        sent_at: timestamp6,
      },
      {
        report_id: 'report_007',
        user_id: 'user_005',
        department_id: 'dept_dev',
        yesterday_achievement: 'バグ修正',
        today_plan: 'パフォーマンス最適化',
        current_issues: 'なし',
        sent_at: timestamp7,
      },
      {
        report_id: 'report_008',
        user_id: 'user_006',
        department_id: 'dept_dev',
        yesterday_achievement: 'インフラ構築',
        today_plan: 'デプロイ準備',
        current_issues: 'なし',
        sent_at: timestamp8,
      },
      {
        report_id: 'report_009',
        user_id: 'user_007',
        department_id: 'dept_dev',
        yesterday_achievement: 'セキュリティ監査',
        today_plan: '脆弱性対応',
        current_issues: 'なし',
        sent_at: timestamp9,
      },
      {
        report_id: 'report_010',
        user_id: 'user_008',
        department_id: 'dept_dev',
        yesterday_achievement: 'API設計',
        today_plan: 'API実装',
        current_issues: 'なし',
        sent_at: timestamp10,
      },
      {
        report_id: 'report_011',
        user_id: 'user_009',
        department_id: 'dept_dev',
        yesterday_achievement: 'テスト環境構築',
        today_plan: 'テスト実行',
        current_issues: 'なし',
        sent_at: timestamp11,
      },
    ];

    const expected_department_id = 'dept_dev';
    const expected_unique_users = new Set([
      'user_001',
      'user_002',
      'user_003',
      'user_004',
      'user_005',
      'user_006',
      'user_007',
      'user_008',
      'user_009',
    ]);
    const expected_unique_user_count = 9;
    const expected_total_reports_from_duplicate_user = 3;
    const expected_all_reports_complete = true;

    const result = validateAllReportsReceived(reports, expected_department_id);

    expect(result.unique_user_count).toBe(expected_unique_user_count);
    expect(result.all_reports_received).toBe(expected_all_reports_complete);
    expect(result.department_id).toBe(expected_department_id);
    expect(result.reports_from_user_001).toBe(expected_total_reports_from_duplicate_user);
    expect(result.unique_user_ids.size).toBe(expected_unique_user_count);
    expect(result.unique_user_ids).toEqual(expected_unique_users);
  });
});