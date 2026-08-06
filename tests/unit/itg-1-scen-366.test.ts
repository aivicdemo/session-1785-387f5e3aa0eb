import { describe, test, expect, beforeEach } from '@jest/globals';
import { isAllReportSubmitted } from '../../src/logic/it-1-br-1-1-1';

describe('朝会報告管理システム - 全員報告完了判定機能', () => {
  // SCEN-366
  test('報告者が10名ちょうどで全員報告済みの場合、朝会開始可能と判定される', () => {
    const all_submitted_reports = [
      {
        user_id: 'ENG001',
        report_date: '2024-01-15',
        yesterday_achievement: 'ユーザー認証機能の実装完了',
        today_plan: '部門管理画面の設計',
        current_issues: 'なし',
        submitted_at: '2024-01-15T08:30:00Z',
      },
      {
        user_id: 'ENG002',
        report_date: '2024-01-15',
        yesterday_achievement: 'データベース設計レビュー完了',
        today_plan: 'API エンドポイント実装',
        current_issues: 'なし',
        submitted_at: '2024-01-15T08:31:00Z',
      },
      {
        user_id: 'ENG003',
        report_date: '2024-01-15',
        yesterday_achievement: 'テストケース作成 50% 完了',
        today_plan: 'テストケース作成 100% 完了',
        current_issues: 'なし',
        submitted_at: '2024-01-15T08:32:00Z',
      },
      {
        user_id: 'ENG004',
        report_date: '2024-01-15',
        yesterday_achievement: 'ドキュメント作成',
        today_plan: 'ドキュメントレビュー',
        current_issues: 'なし',
        submitted_at: '2024-01-15T08:33:00Z',
      },
      {
        user_id: 'ENG005',
        report_date: '2024-01-15',
        yesterday_achievement: 'UI フレームワーク選定',
        today_plan: 'UI プロトタイプ開発',
        current_issues: 'なし',
        submitted_at: '2024-01-15T08:34:00Z',
      },
      {
        user_id: 'ENG006',
        report_date: '2024-01-15',
        yesterday_achievement: 'インフラ構成図作成',
        today_plan: 'インフラ構築開始',
        current_issues: 'AWS 権限待ち',
        submitted_at: '2024-01-15T08:35:00Z',
      },
      {
        user_id: 'ENG007',
        report_date: '2024-01-15',
        yesterday_achievement: 'セキュリティレビュー実施',
        today_plan: '脆弱性対応',
        current_issues: 'なし',
        submitted_at: '2024-01-15T08:36:00Z',
      },
      {
        user_id: 'ENG008',
        report_date: '2024-01-15',
        yesterday_achievement: '品質メトリクス集計',
        today_plan: 'メトリクス分析',
        current_issues: 'なし',
        submitted_at: '2024-01-15T08:37:00Z',
      },
      {
        user_id: 'ENG009',
        report_date: '2024-01-15',
        yesterday_achievement: 'パフォーマンステスト実施',
        today_plan: '最適化施策実装',
        current_issues: 'なし',
        submitted_at: '2024-01-15T08:38:00Z',
      },
      {
        user_id: 'ENG010',
        report_date: '2024-01-15',
        yesterday_achievement: 'デプロイメント環境構築',
        today_plan: 'CI/CD パイプライン設定',
        current_issues: 'なし',
        submitted_at: '2024-01-15T08:39:00Z',
      },
    ];

    const department_member_count = 10;

    const result = isAllReportSubmitted(
      all_submitted_reports,
      department_member_count
    );

    expect(result).toBe(true);
  });
});