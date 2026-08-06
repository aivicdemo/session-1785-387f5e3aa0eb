import { validateMorningReportSubmission } from '../../src/logic/it-1';

describe('朝会報告送信バリデーション', () => {
  // SCEN-164
  test('第3項目が空文字列のとき送信を中断してエラーメッセージを表示する', () => {
    const input = {
      yesterdayAccomplishment: '昨日は要件定義を完了しました',
      todayPlan: '本日はDB設計を開始します',
      currentChallenge: '',
    };

    expect(() => validateMorningReportSubmission(input)).toThrow(/抱えている課題/);
  });
});