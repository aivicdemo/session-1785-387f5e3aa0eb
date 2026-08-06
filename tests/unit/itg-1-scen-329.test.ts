import { prioritizeCourierTargets } from '../../src/logic/it-1-br-1-1-1';

describe('報告送信時に、送信者本人と部長宛に確認メールを自動配信する機能', () => {
  // SCEN-329
  test('催促対象部員の優先順位付け機能 - 部長IDがnullのとき処理がエラーになる', () => {
    const unreported_members = [
      { user_id: 'user_001', name: '田中太郎', department_id: 'dev_dept', report_status: 'unreported' as const },
      { user_id: 'user_002', name: '鈴木花子', department_id: 'dev_dept', report_status: 'delayed' as const },
    ];
    const morning_assembly_time = new Date('2024-01-15T09:00:00Z');
    const department_head_id = null;

    expect(() =>
      prioritizeCourierTargets({
        unreported_members,
        morning_assembly_time,
        department_head_id,
      })
    ).toThrow(/部長ID/);
  });
});