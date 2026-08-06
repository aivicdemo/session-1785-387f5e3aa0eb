import { prioritizeUrgentMembers } from '../../src/logic/it-1-br-1-1-1';

describe('催促対象部員の優先順位付け機能', () => {
  // SCEN-332
  test('部員IDが欠落しているレコードを検出してエラーをthrowする', () => {
    const unsent_members = [
      { member_id: 'M001', name: '田中太郎', department_id: 'D001', submission_status: 'unsent' as const },
      { member_id: 'M002', name: '鈴木次郎', department_id: 'D001', submission_status: 'unsent' as const },
      { member_id: 'M003', name: '高橋三郎', department_id: 'D001', submission_status: 'unsent' as const },
      { member_id: 'M004', name: '伊藤四郎', department_id: 'D001', submission_status: 'unsent' as const },
      { member_id: 'M005', name: '山田五郎', department_id: 'D001', submission_status: 'unsent' as const },
      { member_id: '', name: '佐藤六郎', department_id: 'D001', submission_status: 'unsent' as const },
      { member_id: 'M007', name: '中村七郎', department_id: 'D001', submission_status: 'unsent' as const },
      { member_id: 'M008', name: '小林八郎', department_id: 'D001', submission_status: 'unsent' as const },
      { member_id: 'M009', name: '加藤九郎', department_id: 'D001', submission_status: 'unsent' as const },
      { member_id: 'M010', name: '渡辺十郎', department_id: 'D001', submission_status: 'unsent' as const },
    ];

    expect(() => prioritizeUrgentMembers(unsent_members)).toThrow(/部員ID/);
  });
});