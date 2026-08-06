import { validateReportSubmission } from '../../src/logic/it-1';

describe('朝会報告送信バリデーション', () => {
  // SCEN-175
  test('第2項目の形式が要求形式に不適合のとき送信を中断してエラーメッセージを表示する', () => {
    const valid_item_1 = 'A機能の実装を完了しました';
    const valid_item_3 = 'データベース接続タイムアウト';

    const test_cases = [
      {
        description: '1000文字を超える長文テキスト',
        invalid_item_2: 'a'.repeat(1001),
      },
      {
        description: '制御文字を含むデータ',
        invalid_item_2: 'テスト\x00データ',
      },
      {
        description: 'NULL値',
        invalid_item_2: null as unknown as string,
      },
    ];

    test_cases.forEach(({ description, invalid_item_2 }) => {
      const submission = {
        yesterday_achievement: valid_item_1,
        today_plan: invalid_item_2,
        current_challenge: valid_item_3,
      };

      expect(() => validateReportSubmission(submission)).toThrow(
        /今日やること|形式/
      );
    });
  });
});