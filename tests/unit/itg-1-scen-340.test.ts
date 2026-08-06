import { prioritizeMissingReporters } from '../../src/logic/it-1-br-1-1-1';

describe('催促対象部員の優先順位付与', () => {
  // SCEN-340: [edge] 催促対象部員優先順位付与機能 - 未送信部員が1名、遅延部員が複数存在する場合、未送信部員が最優先位置に配列される
  test('未送信部員1名と遅延部員3名が混在する場合、未送信部員が最優先で配列される', () => {
    const members_input = [
      {
        member_id: 'E002',
        status: 'delayed',
        delay_minutes: 5,
      },
      {
        member_id: 'E001',
        status: 'not_submitted',
        delay_minutes: null,
      },
      {
        member_id: 'E003',
        status: 'delayed',
        delay_minutes: 10,
      },
      {
        member_id: 'E004',
        status: 'delayed',
        delay_minutes: 15,
      },
    ];

    const result = prioritizeMissingReporters(members_input);

    expect(result.length).toBe(4);
    expect(result[0].member_id).toBe('E001');
    expect(result[0].status).toBe('not_submitted');
    expect(result[1].member_id).toBe('E004');
    expect(result[1].status).toBe('delayed');
    expect(result[1].delay_minutes).toBe(15);
    expect(result[2].member_id).toBe('E003');
    expect(result[2].status).toBe('delayed');
    expect(result[2].delay_minutes).toBe(10);
    expect(result[3].member_id).toBe('E002');
    expect(result[3].status).toBe('delayed');
    expect(result[3].delay_minutes).toBe(5);
  });
});