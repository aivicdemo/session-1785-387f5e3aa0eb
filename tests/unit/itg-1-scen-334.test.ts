import { prioritizeUnreportedMembers } from '../../src/logic/it-1-br-1-1-1';

describe('催促対象部員の優先順位付け機能 - 報告期限日時が欠落するケース', () => {
  // SCEN-334
  test('未送信部員リストに報告期限日時がNULLのレコードが含まれるときエラーをthrowする', () => {
    const unreportedMembers = [
      {
        user_id: 'U001',
        user_name: '田中太郎',
        department_id: 'D001',
        report_deadline_at: new Date('2024-01-15T08:30:00Z'),
      },
      {
        user_id: 'U002',
        user_name: '鈴木花子',
        department_id: 'D001',
        report_deadline_at: null,
      },
    ];

    const meeting_start_at = new Date('2024-01-15T09:00:00Z');

    expect(() =>
      prioritizeUnreportedMembers(unreportedMembers, meeting_start_at)
    ).toThrow(/報告期限日時が未設定です|無効なレコード/);
  });
});