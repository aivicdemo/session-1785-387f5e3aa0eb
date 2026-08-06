import { generateManagerConfirmationEmail } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-250
  test('遅延フラグがfalseの場合、部長への確認メール本文に遅延情報が含まれない', () => {
    const report_data = {
      yesterday_achievement: 'タスクA完了',
      today_plan: 'タスクB開始',
      current_issues: '課題なし',
      delay_flag: false,
    };

    const email_content = generateManagerConfirmationEmail(report_data);

    expect(email_content).not.toMatch(/遅延/);
    expect(email_content).not.toMatch(/遅れ/);
    expect(email_content).not.toMatch(/遅延情報/);
    expect(email_content).not.toMatch(/未報告/);

    expect(email_content).toMatch(/昨日やったこと/);
    expect(email_content).toMatch(/今日やること/);
    expect(email_content).toMatch(/抱えている課題/);

    expect(email_content).toContain('タスクA完了');
    expect(email_content).toContain('タスクB開始');
    expect(email_content).toContain('課題なし');
  });
});