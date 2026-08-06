import { validateAndAggregateReport } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-490
  test('報告者の所属部門と部長の所属部門が異なる場合にエラーになる', () => {
    const reporter_user_id = 'user_001';
    const reporter_department_id = 'dept_sales';
    const manager_department_id = 'dept_planning';
    const yesterday_achievement = '昨日はA機能の実装を進めました';
    const today_plan = '本日はB機能のテストを実施予定です';
    const current_issue = '納期が短いため工数確保が課題です';

    const input = {
      reporter_user_id,
      reporter_department_id,
      manager_department_id,
      yesterday_achievement,
      today_plan,
      current_issue,
    };

    expect(() => validateAndAggregateReport(input)).toThrow(/DEPARTMENT_MISMATCH/);
  });
});