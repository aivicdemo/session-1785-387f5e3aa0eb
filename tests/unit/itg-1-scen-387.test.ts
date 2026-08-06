import { checkDeadline } from '../../src/logic/it-1-br-1-1-1';

describe('報告送信時の確認メール自動配信機能 - 報告期限判定', () => {
  // SCEN-387
  test('送信者情報が undefined のとき、期限判定ロジックが実行されず早期リターンする', () => {
    const sender = undefined;

    const result = checkDeadline(sender);

    expect(result).toBeNull();
  });
});