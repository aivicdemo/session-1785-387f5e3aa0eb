import { validateReportContent } from '../../src/logic/it-1';

describe('日報入力フォームの提供と送信機能', () => {
  test('SCEN-482: 報告内容検証・集約機能 - 今日やることが欠落している場合にエラーになる', () => {
    const report_content = {
      yesterday_achievement: '完了した業務の説明',
      today_plan: '',
      current_issues: '現在の課題説明',
    };

    expect(() => validateReportContent(report_content)).toThrow(/今日やること/);
  });
});