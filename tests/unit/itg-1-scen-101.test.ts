import { validateMorningReportSubmission } from '../../src/logic/it-1';

describe('朝会報告送信検証機能', () => {
  // SCEN-101
  test('本日の予定と抱えている課題が両方空のとき送信を中止してエラーメッセージを表示する', () => {
    const yesterdayAccomplishment = '昨日実装を完了した';
    const todayPlan = '';
    const currentIssue = '';

    expect(() => {
      validateMorningReportSubmission({
        yesterdayAccomplishment,
        todayPlan,
        currentIssue,
      });
    }).toThrow(/本日の予定と抱えている課題/);
  });
});