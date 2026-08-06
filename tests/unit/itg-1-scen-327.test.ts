import { prioritizeRemindTargetMembers } from '../../src/logic/it-1-br-1-1-1';

describe('催促対象部員の優先順位付け機能', () => {
  test('SCEN-327: 未送信部員リストが空配列のとき処理がエラーになる', () => {
    const empty_unsent_member_list: string[] = [];
    
    expect(() => prioritizeRemindTargetMembers(empty_unsent_member_list)).toThrow(/未送信部員リストが空です/);
  });
});