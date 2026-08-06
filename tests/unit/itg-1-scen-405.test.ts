import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { sendConfirmationEmailsOnSubmission } from '../../src/logic/it-1-br-1-1-1';

// Mock fetch for email sending
const fetchMock = require('jest-fetch-mock');
fetchMock.enableMocks();

describe('報告送信時の確認メール自動配信', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-405
  it('催促ループ終了時に報告未提出部員が1件の場合、部長に通知メールが送信される', async () => {
    // 前提条件：催促ループが実行される状態
    // 10名中9名が提出済み、1名のみ未提出
    const submitted_user_ids = ['U001', 'U002', 'U003', 'U004', 'U005', 'U006', 'U007', 'U008', 'U009'];
    const unsubmitted_user_id = 'U010';
    const all_user_ids = [...submitted_user_ids, unsubmitted_user_id];
    const department_head_id = 'U999';
    const department_head_email = 'head@example.com';
    const unsubmitted_user_name = '田中太郎';
    const unsubmitted_user_email = 'tanaka@example.com';
    const submission_date = '2024-01-15';
    const morning_meeting_start_time = '09:00';

    // 送信対象のメールデータ
    const email_request = {
      recipient_user_id: department_head_id,
      recipient_email: department_head_email,
      subject: `【朝会報告確認】未報告部員のお知らせ - ${submission_date}`,
      body: `部長へのご報告\n\n朝会開始予定時刻（${morning_meeting_start_time}）までに、以下の部員から日報の報告がありません。\n\n【未報告部員】\n- ${unsubmitted_user_name}\n\n本日の朝会開始前に、該当部員への催促をお願いいたします。`,
      email_type: 'unsubmitted_notification',
      sent_at: '2024-01-15T09:15:00Z',
      submission_date: submission_date,
      total_employees: 10,
      submitted_count: 9,
      unsubmitted_count: 1,
      unsubmitted_user_list: [
        {
          user_id: unsubmitted_user_id,
          user_name: unsubmitted_user_name,
          user_email: unsubmitted_user_email,
        },
      ],
    };

    // メール送信APIのモック設定
    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 'sent',
        message_id: 'MSG001',
        recipient: department_head_email,
        sent_timestamp: '2024-01-15T09:15:00Z',
      }),
      { status: 200 }
    );

    // テスト実行：催促ループの最終実行をトリガー
    const result = await sendConfirmationEmailsOnSubmission({
      department_head_id: department_head_id,
      department_head_email: department_head_email,
      all_user_ids: all_user_ids,
      submitted_user_ids: submitted_user_ids,
      unsubmitted_user_list: [
        {
          user_id: unsubmitted_user_id,
          user_name: unsubmitted_user_name,
          user_email: unsubmitted_user_email,
        },
      ],
      submission_date: submission_date,
      morning_meeting_start_time: morning_meeting_start_time,
      email_send_endpoint: 'https://mail.example.com/send',
    });

    // 期待値の検証
    expect(result).toBeDefined();
    expect(result.email_sent).toBe(true);
    expect(result.recipient_email).toBe(department_head_email);
    expect(result.unsubmitted_count).toBe(1);
    expect(result.submitted_count).toBe(9);
    expect(result.total_employees).toBe(10);

    // メール送信APIが呼ばれたことを確認
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call_args = fetchMock.mock.calls[0];
    expect(call_args[0]).toBe('https://mail.example.com/send');
    expect(call_args[1].method).toBe('POST');

    // 送信されたメールの本文に未提出部員の情報が含まれていることを確認
    const sent_body = JSON.parse(call_args[1].body);
    expect(sent_body.recipient_email).toBe(department_head_email);
    expect(sent_body.unsubmitted_count).toBe(1);
    expect(sent_body.submitted_count).toBe(9);
    expect(sent_body.unsubmitted_user_list).toHaveLength(1);
    expect(sent_body.unsubmitted_user_list[0].user_name).toBe(unsubmitted_user_name);
    expect(sent_body.unsubmitted_user_list[0].user_email).toBe(unsubmitted_user_email);

    // メール本文に「未報告部員」の記載があることを確認
    expect(sent_body.body).toMatch(/未報告部員/);
    expect(sent_body.body).toMatch(new RegExp(unsubmitted_user_name));
    expect(sent_body.body).toMatch(/1名/);
  });
});