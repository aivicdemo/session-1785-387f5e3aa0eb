import { validateReportFormat } from '../../src/logic/it-1-br-1-1-1';

describe('報告内容フォーマット検証機能', () => {
  // SCEN-491: [edge] 報告内容フォーマット検証機能 - 3項目すべてが入力されている場合、検証が承認される
  test('3項目すべてが有効な値で入力されている場合、検証が承認される', () => {
    const payload = {
      yesterday_accomplishment: 'ドキュメント作成',
      today_plan: 'レビュー実施',
      current_challenge: '環境構築の遅延',
    };

    const result = validateReportFormat(payload);

    expect(result).toEqual({
      validation_passed: true,
      error_messages: [],
    });
  });
});