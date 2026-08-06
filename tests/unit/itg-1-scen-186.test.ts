import { validateAndSubmitDailyReport } from '../../src/logic/it-1';

describe('朝会報告送信バリデーション', () => {
  // SCEN-186
  test('項目1が最小許容文字数ちょうどで送信が続行される', async () => {
    const minimum_char_item1 = 'a';
    const valid_item2 = 'valid task for today';
    const valid_item3 = valid_item2;
    const user_id = 'user-001';
    const report_date = '2024-01-15';

    const mock_send_email = jest.fn().mockResolvedValue({ success: true });

    const result = await validateAndSubmitDailyReport(
      {
        user_id,
        report_date,
        yesterday_accomplishment: minimum_char_item1,
        today_plan: valid_item2,
        current_issue: valid_item3,
      },
      mock_send_email
    );

    expect(result.is_valid).toBe(true);
    expect(result.validation_errors).toEqual([]);
    expect(result.submission_status).toBe('submitted');
    expect(mock_send_email).toHaveBeenCalled();
    expect(mock_send_email).toHaveBeenCalledWith(
      expect.objectContaining({
        to: expect.any(String),
        subject: expect.stringContaining('朝会報告'),
        body: expect.stringContaining(minimum_char_item1),
      })
    );
  });
});