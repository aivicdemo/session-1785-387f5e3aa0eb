import { sendConfirmationEmailToReporterAndManager } from '../../src/logic/it-1-br-1-1-1';

describe('報告送信時の確認メール自動配信機能', () => {
  // SCEN-506: [error] 未報告催促メール通知機能 - 部門の部員リストが空配列で未報告者の判定が不正になる
  test('部員リストが空配列の場合、未報告者判定がスキップされエラー発生なく正常終了し、催促メール送信されない', async () => {
    const department_id = 'DEPT-001';
    const department_name = '開発部';
    const employees = [];
    const reporter_user_id = 'ENG-001';
    const reporter_name = '山田太郎';
    const manager_user_id = 'MGR-001';
    const manager_email = 'manager@example.com';
    const yesterday_achievement = '昨日は機能Aの実装を完了した';
    const today_plan = '本日は機能Bの実装を開始する';
    const issue = '環境構築でトラブルが発生している';
    const submission_timestamp = new Date('2024-01-15T07:30:00Z');

    const input_payload = {
      department_id,
      department_name,
      employees,
      reporter_user_id,
      reporter_name,
      manager_user_id,
      manager_email,
      yesterday_achievement,
      today_plan,
      issue,
      submission_timestamp,
    };

    const result = await sendConfirmationEmailToReporterAndManager(input_payload);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.emails_sent_count).toBe(0);
    expect(result.unreported_employees).toEqual([]);
    expect(result.escalation_triggered).toBe(false);
  });
});