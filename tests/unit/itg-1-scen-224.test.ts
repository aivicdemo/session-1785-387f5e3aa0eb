import { aggregateDailyReportsBySubmitter } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-224
  test('整形された日報の一覧を、送信者別に正確に集約して返す', () => {
    const report_a_1 = {
      submitter_id: 'user_a',
      submitter_name: 'エンジニアA',
      yesterday_achievement: '機能Xの実装完了',
      today_plan: '機能Yの開発開始',
      current_issues: 'データベース接続の遅延',
      submitted_at: new Date('2024-01-15T08:00:00Z'),
    };

    const report_a_2 = {
      submitter_id: 'user_a',
      submitter_name: 'エンジニアA',
      yesterday_achievement: '修正案の確認',
      today_plan: 'テストケース作成',
      current_issues: 'テスト環境の構築',
      submitted_at: new Date('2024-01-15T08:15:00Z'),
    };

    const report_a_3 = {
      submitter_id: 'user_a',
      submitter_name: 'エンジニアA',
      yesterday_achievement: 'ドキュメント更新',
      today_plan: 'レビュー対応',
      current_issues: 'レビューコメントの整理',
      submitted_at: new Date('2024-01-15T08:30:00Z'),
    };

    const report_b_1 = {
      submitter_id: 'user_b',
      submitter_name: 'エンジニアB',
      yesterday_achievement: 'API仕様確認',
      today_plan: 'エンドポイント実装',
      current_issues: 'クライアント要件の曖昧性',
      submitted_at: new Date('2024-01-15T07:45:00Z'),
    };

    const report_b_2 = {
      submitter_id: 'user_b',
      submitter_name: 'エンジニアB',
      yesterday_achievement: 'ユニットテスト作成',
      today_plan: '統合テスト実行',
      current_issues: 'テスト失敗の原因特定中',
      submitted_at: new Date('2024-01-15T08:20:00Z'),
    };

    const report_c_1 = {
      submitter_id: 'user_c',
      submitter_name: 'エンジニアC',
      yesterday_achievement: 'インフラ整備完了',
      today_plan: 'ログ監視設定',
      current_issues: 'リソース使用率の異常',
      submitted_at: new Date('2024-01-15T08:10:00Z'),
    };

    const input_reports = [
      report_a_1,
      report_a_2,
      report_a_3,
      report_b_1,
      report_b_2,
      report_c_1,
    ];

    const result = aggregateDailyReportsBySubmitter(input_reports);

    expect(result).toHaveProperty('user_a');
    expect(result).toHaveProperty('user_b');
    expect(result).toHaveProperty('user_c');

    expect(result.user_a).toHaveLength(3);
    expect(result.user_b).toHaveLength(2);
    expect(result.user_c).toHaveLength(1);

    expect(result.user_a[0]).toEqual({
      submitter_id: 'user_a',
      submitter_name: 'エンジニアA',
      yesterday_achievement: '機能Xの実装完了',
      today_plan: '機能Yの開発開始',
      current_issues: 'データベース接続の遅延',
      submitted_at: new Date('2024-01-15T08:00:00Z'),
    });

    expect(result.user_a[1]).toEqual({
      submitter_id: 'user_a',
      submitter_name: 'エンジニアA',
      yesterday_achievement: '修正案の確認',
      today_plan: 'テストケース作成',
      current_issues: 'テスト環境の構築',
      submitted_at: new Date('2024-01-15T08:15:00Z'),
    });

    expect(result.user_a[2]).toEqual({
      submitter_id: 'user_a',
      submitter_name: 'エンジニアA',
      yesterday_achievement: 'ドキュメント更新',
      today_plan: 'レビュー対応',
      current_issues: 'レビューコメントの整理',
      submitted_at: new Date('2024-01-15T08:30:00Z'),
    });

    expect(result.user_b[0]).toEqual({
      submitter_id: 'user_b',
      submitter_name: 'エンジニアB',
      yesterday_achievement: 'API仕様確認',
      today_plan: 'エンドポイント実装',
      current_issues: 'クライアント要件の曖昧性',
      submitted_at: new Date('2024-01-15T07:45:00Z'),
    });

    expect(result.user_b[1]).toEqual({
      submitter_id: 'user_b',
      submitter_name: 'エンジニアB',
      yesterday_achievement: 'ユニットテスト作成',
      today_plan: '統合テスト実行',
      current_issues: 'テスト失敗の原因特定中',
      submitted_at: new Date('2024-01-15T08:20:00Z'),
    });

    expect(result.user_c[0]).toEqual({
      submitter_id: 'user_c',
      submitter_name: 'エンジニアC',
      yesterday_achievement: 'インフラ整備完了',
      today_plan: 'ログ監視設定',
      current_issues: 'リソース使用率の異常',
      submitted_at: new Date('2024-01-15T08:10:00Z'),
    });

    const total_report_count =
      result.user_a.length + result.user_b.length + result.user_c.length;
    expect(total_report_count).toBe(6);
  });
});