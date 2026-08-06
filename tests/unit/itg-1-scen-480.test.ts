import { validateReportContent } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-480
  test('昨日やったことが欠落している場合にエラーになる', () => {
    const report_content = {
      yesterday_achievement: '',
      today_plan: 'タスクA実施',
      current_challenges: '課題1対応',
    };

    expect(() => validateReportContent(report_content)).toThrow(/昨日やったこと/);
  });
});