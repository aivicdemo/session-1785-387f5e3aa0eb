import { describe, test, expect, beforeEach } from '@jest/globals';
import { validateAndSubmitReport } from '../../src/logic/it-1';

describe('朝会報告送信検証機能', () => {
  // SCEN-092
  test('同一の入力で2回実行した場合、同じ結果が返される', () => {
    const input_yesterday = '顧客A対応';
    const input_today = '提案資料作成';
    const input_issue = '予算承認待ち';

    const result_1st = validateAndSubmitReport({
      yesterday: input_yesterday,
      today: input_today,
      issue: input_issue,
    });

    const result_2nd = validateAndSubmitReport({
      yesterday: input_yesterday,
      today: input_today,
      issue: input_issue,
    });

    expect(result_1st.statusCode).toBe(result_2nd.statusCode);
    expect(result_1st.message).toBe(result_2nd.message);
    expect(result_1st.submissionCompleted).toBe(result_2nd.submissionCompleted);
    expect(result_1st.yesterday).toBe(result_2nd.yesterday);
    expect(result_1st.today).toBe(result_2nd.today);
    expect(result_1st.issue).toBe(result_2nd.issue);
  });
});