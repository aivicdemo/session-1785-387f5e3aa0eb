import { prioritizeUnsendingMembers } from "../../src/logic/it-1-br-1-1-1";

describe("催促対象部員の優先順位付け機能", () => {
  // SCEN-325
  test("未送信部員リストが null のとき処理がエラーになる", () => {
    expect(() => prioritizeUnsendingMembers(null as any, [])).toThrow(/未送信部員/);
  });
});