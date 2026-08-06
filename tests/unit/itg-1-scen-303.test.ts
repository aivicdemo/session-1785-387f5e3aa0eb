import { sendConfirmationEmail } from '../../src/logic/it-1-br-1-1-1';

describe('確認メール配信機能', () => {
  test('SCEN-303: 朝会報告IDが空文字のとき、メール配信処理が中断される', () => {
    const empty_report_id = '';
    const sender_user_id = 'ENG001';
    const department_head_user_id = 'DEPT001';
    const yesterday_achievement = '昨日の実績を完了';
    const today_plan = '本日の予定を実行';
    const current_issues = '抱えている課題を解決';

    const result = sendConfirmationEmail({
      report_id: empty_report_id,
      sender_user_id: sender_user_id,
      department_head_user_id: department_head_user_id,
      yesterday_achievement: yesterday_achievement,
      today_plan: today_plan,
      current_issues: current_issues,
    });

    expect(result.success).toBe(false);
    expect(result.error_code).toBe('INVALID_REPORT_ID_EMPTY');
    expect(result.email_send_count).toBe(0);
  });
});