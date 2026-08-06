import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateAndSubmitReport } from '../../src/logic/it-1';

const fetchMock = require('jest-fetch-mock');

describe('朝会報告送信フォーム', () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-183
  test('項目3の文字数が最大許容値ちょうどで送信が続行される', () => {
    const max_chars_item_3 = 500;
    const item_3_text = 'a'.repeat(max_chars_item_3);

    const report_payload = {
      user_id: 'engineer_001',
      yesterday_achievement: 'Completed API integration testing',
      today_plan: 'Start database optimization',
      current_issues: item_3_text,
      submitted_at: new Date('2024-01-15T08:30:00Z').toISOString(),
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 'success',
        report_id: 'report_20240115_001',
        saved_at: '2024-01-15T08:30:00Z',
        email_queued: true,
      }),
      { status: 200 }
    );

    const result = validateAndSubmitReport(report_payload);

    expect(result).toEqual({
      success: true,
      report_id: 'report_20240115_001',
      validation_errors: [],
      email_status: 'queued',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const call_args = fetchMock.mock.calls[0];
    const fetch_url = call_args[0];
    const fetch_options = call_args[1];

    expect(fetch_url).toBe('/api/reports/submit');
    expect(fetch_options.method).toBe('POST');

    const request_body = JSON.parse(fetch_options.body);
    expect(request_body.current_issues).toBe(item_3_text);
    expect(request_body.current_issues.length).toBe(max_chars_item_3);
  });
});