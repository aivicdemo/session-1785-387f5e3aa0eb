import { formatReportUnifiedFormat } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-225
  test('日報統一フォーマット整形・表示機能 - 同じ日報入力で複数回の整形処理を実行しても常に同じ結果が返される', () => {
    const yesterday_accomplishment = 'A機能のバグ修正';
    const today_plan = 'B機能の実装開始';
    const current_issue = 'C機能の仕様が未確定';

    const input_data = {
      yesterday_accomplishment,
      today_plan,
      current_issue,
    };

    const result1 = formatReportUnifiedFormat(input_data);
    const result2 = formatReportUnifiedFormat(input_data);
    const result3 = formatReportUnifiedFormat(input_data);

    expect(result1).toEqual(result2);
    expect(result2).toEqual(result3);

    expect(result1).toMatchObject({
      yesterday_accomplishment: 'A機能のバグ修正',
      today_plan: 'B機能の実装開始',
      current_issue: 'C機能の仕様が未確定',
    });

    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
    expect(JSON.stringify(result2)).toBe(JSON.stringify(result3));
  });
});