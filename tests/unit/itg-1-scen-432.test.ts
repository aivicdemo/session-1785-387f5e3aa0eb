import { updatePromptStopStatus } from "../../src/logic/it-1-br-1-1-1";

describe("報告送信時に送信者本人と部長宛に確認メールを自動配信する機能", () => {
  // SCEN-432
  test("自動催促停止判定機能 - 催促停止ステータスの更新対象レコードが見つからないときエラーになる", async () => {
    const nonexistentId = "nonexistent-id-12345";

    expect(async () => {
      await updatePromptStopStatus(nonexistentId);
    }).rejects.toThrow(/見つかりません/);
  });
});