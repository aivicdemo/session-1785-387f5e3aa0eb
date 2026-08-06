import { validateAndSubmitReport } from '../../src/logic/it-1';

describe('朝会報告送信検証機能', () => {
  // SCEN-103: [edge] 朝会報告送信検証機能 - 3項目すべて入力済みで送信処理へ進む
  test('3項目すべて入力済みで送信処理が実行される', () => {
    const report_input = {
      yesterday_achievement: '顧客A社との打ち合わせ実施',
      today_plan: '提案書の作成',
      current_issues: 'リソース不足による納期調整',
    };

    const result = validateAndSubmitReport(report_input);

    expect(result.is_valid).toBe(true);
    expect(result.submit_allowed).toBe(true);
    expect(result.yesterday_achievement).toBe('顧客A社との打ち合わせ実施');
    expect(result.today_plan).toBe('提案書の作成');
    expect(result.current_issues).toBe('リソース不足による納期調整');
    expect(result.message).toBe('報告を送信しました');
    expect(result.form_reset).toBe(true);
  });
});