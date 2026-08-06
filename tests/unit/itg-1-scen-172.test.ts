import { validateMorningReportSubmission } from '../../src/logic/it-1';

const fetchMock = require('jest-fetch-mock');

describe('朝会報告入力フォームと送信機能', () => {
  test('SCEN-172: 第2項目に禁止文字を含む場合、送信を中断してエラーメッセージを表示する', () => {
    fetchMock.resetMocks();

    const report_input_payload = {
      yesterday_accomplishment: '昨日は顧客Aの要件ヒアリングを完了しました',
      todays_plan: '本日のやることは<script>alert("test")</script>です',
      current_issues: 'データベース接続のタイムアウト問題を調査中です',
    };

    const validation_result = validateMorningReportSubmission(report_input_payload);

    expect(validation_result.is_valid).toBe(false);
    expect(validation_result.error_field).toBe('todays_plan');
    expect(validation_result.error_message).toMatch(/禁止文字/);
    expect(validation_result.should_save_report).toBe(false);
    expect(fetchMock.mock.calls.length).toBe(0);
  });
});