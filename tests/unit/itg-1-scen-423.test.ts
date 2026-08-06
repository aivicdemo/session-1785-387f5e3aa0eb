import { sendNotificationEmailToManagerForUnsubmittedMembers } from "../../src/logic/it-1-br-1-1-1";

describe("未提出部員通知機能 - メール配信", () => {
  // SCEN-423: [error] 未提出部員通知機能 - 未提出部員情報リストが null のときエラーになる
  test("未提出部員情報リストが null の場合、エラーをスロー", () => {
    const unsubmittedMembersList = null;
    const managerEmail = "管理者@example.com";

    expect(() =>
      sendNotificationEmailToManagerForUnsubmittedMembers(
        unsubmittedMembersList,
        managerEmail
      )
    ).toThrow(/未提出部員情報リスト/);
  });
});