import { checkSubmissionStatus } from '../../src/logic/it-1-br-1-1-1';

describe('報告送信時に、送信者本人と部長宛に確認メールを自動配信する機能', () => {
  // SCEN-203
  test('部員一覧が空配列のとき、送信状況の確認処理がエラーになる', () => {
    const empty_employees: never[] = [];

    expect(() => {
      checkSubmissionStatus(empty_employees);
    }).toThrow(/部員一覧/);
  });
});