import { prioritizePromptionTargets } from '../../src/logic/it-1-br-1-1-1';

describe('催促対象部員の優先順位付け機能', () => {
  test('SCEN-331: 未送信部員リストと遅延部員リストの両方が空のときエラーになる', () => {
    const unsentMembers: string[] = [];
    const delayedMembers: string[] = [];

    expect(() => {
      prioritizePromptionTargets(unsentMembers, delayedMembers);
    }).toThrow(/入力リストが両方とも空/);
  });
});