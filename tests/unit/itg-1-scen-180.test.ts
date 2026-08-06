import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateAndSendMorningReport } from '../../src/logic/it-1';

const fetchMock = require('jest-fetch-mock');

describe('朝会報告送信フォーム - バリデーションと送信機能', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-180: [edge] 朝会報告送信バリデーション - 項目2の文字数が最大許容値ちょうどで送信が続行される
  test('should continue submission when item2 has exactly maximum character count', async () => {
    // Arrange: テスト環境でメール送信機能をスタブ化
    const max_item2_length = 500;
    const item2_max_chars = 'あ'.repeat(max_item2_length);
    const item1_value = '昨日のタスクを完了しました';
    const item3_value = '現在、リソース不足が課題です';
    const user_id = 'engineer_001';
    const send_date = '2024-01-15';
    const send_time = '2024-01-15T08:30:00Z';

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: true,
        message: '確認メール送信完了',
        email_sent_to: ['engineer_001@example.com', 'department_head@example.com']
      }),
      { status: 200 }
    );

    const input_payload = {
      user_id: user_id,
      item_1_yesterday_results: item1_value,
      item_2_today_plans: item2_max_chars,
      item_3_challenges: item3_value,
      submit_timestamp: send_time
    };

    // Act: 朝会報告送信フォームにアクセスし、項目を入力して送信ボタンをクリック
    const result = await validateAndSendMorningReport(input_payload);

    // Assert: 送信処理が続行され、バリデーションエラーが表示されず、確認メール送信が実行される
    expect(result).toEqual({
      success: true,
      submission_id: expect.any(String),
      item_1_length: item1_value.length,
      item_2_length: max_item2_length,
      item_3_length: item3_value.length,
      validation_passed: true,
      email_send_status: 'completed',
      recipients_count: 2,
      message: '確認メール送信完了'
    });

    expect(result.validation_passed).toBe(true);
    expect(result.item_2_length).toBe(500);
    expect(result.email_send_status).toBe('completed');
    expect(result.recipients_count).toBe(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/send-confirmation-email'),
      expect.any(Object)
    );
  });
});