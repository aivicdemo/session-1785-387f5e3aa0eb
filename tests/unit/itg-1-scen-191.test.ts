import { validateMorningReportSubmission } from '../../src/logic/it-1';

describe('朝会報告送信フォームのバリデーション', () => {
  // SCEN-191
  test('項目3が最小許容文字数直下でエラーが発生する', () => {
    // Arrange
    const MIN_CHARS_ITEM3 = 10;
    const item1_yesterday = 'オンボーディングドキュメント作成完了';
    const item2_today = 'APIエンドポイント実装開始';
    const item3_challenge = 'リス'; // MIN_CHARS_ITEM3 - 1 = 9文字

    const payload = {
      yesterday: item1_yesterday,
      today: item2_today,
      challenge: item3_challenge,
    };

    // Act & Assert
    expect(() => validateMorningReportSubmission(payload)).toThrow(/項目3/);
  });
});