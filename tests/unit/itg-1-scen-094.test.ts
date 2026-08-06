import { validateAndSendMorningReport } from '../../src/logic/it-1';

describe('朝会報告送信検証機能', () => {
  // SCEN-094
  test('昨日の実績がnullのとき送信を中止してエラーメッセージを表示する', () => {
    const mockSendEmail = jest.fn();

    const report = {
      yesterday_achievement: null,
      today_plan: '顧客A社との打ち合わせ準備',
      current_issues: 'プロジェクトBの進捗遅延',
    };

    expect(() => {
      validateAndSendMorningReport(report, mockSendEmail);
    }).toThrow(/昨日の実績/);

    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});