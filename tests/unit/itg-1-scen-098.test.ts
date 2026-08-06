import { validateAndSubmitDailyReport } from '../../src/logic/it-1';

describe('朝会報告入力フォームの提供と送信機能', () => {
  // SCEN-098
  test('抱えている課題がnullのとき送信を中止してエラーメッセージを表示する', () => {
    const yesterday_achievement = '昨日は顧客Aのバグ修正を完了した';
    const today_plan = '本日はユーザー認証機能の実装を開始する';
    const challenges = null;
    const user_id = 'ENG-001';
    const report_date = '2024-01-15';

    expect(() =>
      validateAndSubmitDailyReport({
        yesterday_achievement,
        today_plan,
        challenges,
        user_id,
        report_date,
      })
    ).toThrow(/抱えている課題/);
  });
});