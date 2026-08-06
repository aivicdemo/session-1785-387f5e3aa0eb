import { validateAndSendReport } from "../../src/logic/it-1";

describe("朝会報告送信フォーム", () => {
  test("SCEN-179: 項目1の文字数が最大許容値直上でエラーが発生する", () => {
    const max_char_item1 = 500;
    const exceeded_char_item1 = "a".repeat(max_char_item1 + 1);
    const valid_item2 = "本日の予定は営業会議とレビューです";
    const valid_item3 = "現在のところ課題はありません";

    const input = {
      yesterday_achievement: exceeded_char_item1,
      today_plan: valid_item2,
      current_issues: valid_item3,
    };

    expect(() => validateAndSendReport(input)).toThrow(/文字数/);
  });
});