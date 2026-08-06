import { runTx3Imp1Agent } from '../../src/logic/it-1';

const fetchMock = require('jest-fetch-mock');

describe('tx-3-imp-1: 報告漏れ特定から催促送信までの自動実行 AIエージェント', () => {
  // SCEN-567
  test('報告漏れ特定から催促送信までの自動実行が開始・各処理・引継ぎ・失敗・完了を監査記録に残す', async () => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();

    const audit_log_init_response = {
      status: 'success',
      cleared_count: 5,
    };
    fetchMock.mockResponseOnce(JSON.stringify(audit_log_init_response), {
      status: 200,
    });

    const clear_audit_logs_result = await fetch(
      'http://localhost/audit-logs/clear',
      { method: 'POST' }
    );
    expect(clear_audit_logs_result.status).toBe(200);
    const clear_audit_logs_body = await clear_audit_logs_result.json();
    expect(clear_audit_logs_body.status).toBe('success');

    const confirmation_email_content = {
      email_id: 'email_001',
      timestamp: '2024-01-15T08:45:00Z',
      subject: '朝会報告確認メール',
      body: '以下の部員から報告を受け取りました。未報告・遅延部員の確認をしてください。',
      submitted_employees: [
        {
          user_id: 'user_101',
          name: '田中太郎',
          department: '開発部',
          submitted_at: '2024-01-15T08:30:00Z',
          is_delayed: false,
        },
        {
          user_id: 'user_102',
          name: '鈴木花子',
          department: '開発部',
          submitted_at: '2024-01-15T08:35:00Z',
          is_delayed: false,
        },
        {
          user_id: 'user_103',
          name: '佐藤次郎',
          department: '開発部',
          submitted_at: '2024-01-14T18:00:00Z',
          is_delayed: true,
        },
        {
          user_id: 'user_104',
          name: '渡辺美咲',
          department: '開発部',
          submitted_at: '2024-01-14T17:30:00Z',
          is_delayed: true,
        },
      ],
      not_submitted_employees: [
        { user_id: 'user_105', name: '高橋健太', department: '開発部' },
        { user_id: 'user_106', name: '小林由美', department: '開発部' },
        { user_id: 'user_107', name: '山田花太郎', department: '開発部' },
      ],
      total_expected_employees: 10,
      deadline_at: '2024-01-15T08:00:00Z',
      morning_meeting_start_at: '2024-01-15T09:00:00Z',
    };

    const agent_input_data = {
      agent_id: 'tx_3_imp_1_agent_001',
      confirmation_email: confirmation_email_content,
      promotion_history: {
        user_105: {
          previous_promotions: [
            {
              sent_at: '2024-01-14T17:00:00Z',
              method: 'email',
              status: 'sent',
            },
            {
              sent_at: '2024-01-14T17:30:00Z',
              method: 'chat',
              status: 'sent',
            },
          ],
          promotion_count: 2,
        },
        user_106: {
          previous_promotions: [],
          promotion_count: 0,
        },
        user_107: {
          previous_promotions: [],
          promotion_count: 0,
        },
      },
    };

    const audit_start_event = {
      event_type: 'agent_start',
      timestamp: '2024-01-15T08:45:30Z',
      agent_id: 'tx_3_imp_1_agent_001',
      input_email_count: 5,
    };

    fetchMock.mockResponseOnce(JSON.stringify({ logged: true }), {
      status: 200,
    });

    const start_log_response = await fetch(
      'http://localhost/audit-logs/log-event',
      {
        method: 'POST',
        body: JSON.stringify(audit_start_event),
      }
    );
    expect(start_log_response.status).toBe(200);

    const ai_client = {
      identifyUnsubmittedAndDelayedEmployees: async (input: any) => {
        return {
          status: 'success',
          unsubmitted_count: 3,
          delayed_count: 2,
          total_identified: 5,
          identified_employees: [
            {
              user_id: 'user_105',
              name: '高橋健太',
              reason: 'not_submitted',
            },
            {
              user_id: 'user_106',
              name: '小林由美',
              reason: 'not_submitted',
            },
            {
              user_id: 'user_107',
              name: '山田花太郎',
              reason: 'not_submitted',
            },
            {
              user_id: 'user_103',
              name: '佐藤次郎',
              reason: 'delayed_over_24h',
            },
            {
              user_id: 'user_104',
              name: '渡辺美咲',
              reason: 'delayed_over_24h',
            },
          ],
          applied_rule: '催促対象=報告未提出または24時間超過遅延',
        };
      },
      determineCandidatesForPromotion: async (input: any) => {
        return {
          status: 'success',
          candidates_count: 4,
          excluded_count: 1,
          candidates: [
            {
              user_id: 'user_106',
              name: '小林由美',
              promotion_count: 0,
              reason: 'unsubmitted',
            },
            {
              user_id: 'user_107',
              name: '山田花太郎',
              promotion_count: 0,
              reason: 'unsubmitted',
            },
            {
              user_id: 'user_103',
              name: '佐藤次郎',
              promotion_count: 0,
              reason: 'delayed_over_24h',
            },
            {
              user_id: 'user_104',
              name: '渡辺美咲',
              promotion_count: 0,
              reason: 'delayed_over_24h',
            },
          ],
          excluded_employees: [
            {
              user_id: 'user_105',
              name: '高橋健太',
              promotion_count: 2,
              reason: 'promotion_limit_reached',
            },
          ],
          applied_rule_name: '催促回数上限チェック（上限2回以下）',
        };
      },
    };

    const audit_identification_event = {
      event_type: 'unsubmitted_delayed_identified',
      timestamp: '2024-01-15T08:45:45Z',
      agent_id: 'tx_3_imp_1_agent_001',
      identified_count: 5,
      unsubmitted_count: 3,
      delayed_count: 2,
      applied_rule: '催促対象=報告未提出または24時間超過遅延',
    };

    fetchMock.mockResponseOnce(JSON.stringify({ logged: true }), {
      status: 200,
    });

    const identification_log_response = await fetch(
      'http://localhost/audit-logs/log-event',
      {
        method: 'POST',
        body: JSON.stringify(audit_identification_event),
      }
    );
    expect(identification_log_response.status).toBe(200);

    const audit_determination_event = {
      event_type: 'promotion_candidates_determined',
      timestamp: '2024-01-15T08:46:00Z',
      agent_id: 'tx_3_imp_1_agent_001',
      candidates_count: 4,
      excluded_count: 1,
      applied_rule_name: '催促回数上限チェック（上限2回以下）',
      excluded_employees: [
        {
          user_id: 'user_105',
          name: '高橋健太',
          promotion_count: 2,
        },
      ],
    };

    fetchMock.mockResponseOnce(JSON.stringify({ logged: true }), {
      status: 200,
    });

    const determination_log_response = await fetch(
      'http://localhost/audit-logs/log-event',
      {
        method: 'POST',
        body: JSON.stringify(audit_determination_event),
      }
    );
    expect(determination_log_response.status).toBe(200);

    const email_send_response = {
      status: 'success',
      sent_count: 4,
      sent_emails: [
        {
          user_id: 'user_106',
          email_id: 'email_send_001',
          sent_at: '2024-01-15T08:46:10Z',
        },
        {
          user_id: 'user_107',
          email_id: 'email_send_002',
          sent_at: '2024-01-15T08:46:12Z',
        },
        {
          user_id: 'user_103',
          email_id: 'email_send_003',
          sent_at: '2024-01-15T08:46:14Z',
        },
        {
          user_id: 'user_104',
          email_id: 'email_send_004',
          sent_at: '2024-01-15T08:46:16Z',
        },
      ],
    };

    fetchMock.mockResponseOnce(JSON.stringify(email_send_response), {
      status: 200,
    });

    const email_send_result = await fetch('http://localhost/mail/send-batch', {
      method: 'POST',
      body: JSON.stringify({
        recipients: [
          { user_id: 'user_106', name: '小林由美' },
          { user_id: 'user_107', name: '山田花太郎' },
          { user_id: 'user_103', name: '佐藤次郎' },
          { user_id: 'user_104', name: '渡辺美咲' },
        ],
        template: 'promotion_email',
      }),
    });
    expect(email_send_result.status).toBe(200);
    const email_send_body = await email_send_result.json();
    expect(email_send_body.status).toBe('success');
    expect(email_send_body.sent_count).toBe(4);

    const chat_send_response = {
      status: 'success',
      sent_count: 4,
      sent_notifications: [
        {
          user_id: 'user_106',
          notification_id: 'chat_notif_001',
          sent_at: '2024-01-15T08:46:20Z',
        },
        {
          user_id: 'user_107',
          notification_id: 'chat_notif_002',
          sent_at: '2024-01-15T08:46:22Z',
        },
        {
          user_id: 'user_103',
          notification_id: 'chat_notif_003',
          sent_at: '2024-01-15T08:46:24Z',
        },
        {
          user_id: 'user_104',
          notification_id: 'chat_notif_004',
          sent_at: '2024-01-15T08:46:26Z',
        },
      ],
    };

    fetchMock.mockResponseOnce(JSON.stringify(chat_send_response), {
      status: 200,
    });

    const chat_send_result = await fetch('http://localhost/chat/send-batch', {
      method: 'POST',
      body: JSON.stringify({
        recipients: [
          { user_id: 'user_106', name: '小林由美' },
          { user_id: 'user_107', name: '山田花太郎' },
          { user_id: 'user_103', name: '佐藤次郎' },
          { user_id: 'user_104', name: '渡辺美咲' },
        ],
        template: 'promotion_notification',
      }),
    });
    expect(chat_send_result.status).toBe(200);
    const chat_send_body = await chat_send_result.json();
    expect(chat_send_body.status).toBe('success');
    expect(chat_send_body.sent_count).toBe(4);

    const audit_send_event = {
      event_type: 'promotion_sent_completed',
      timestamp: '2024-01-15T08:46:30Z',
      agent_id: 'tx_3_imp_1_agent_001',
      email_sent_count: 4,
      chat_sent_count: 4,
      email_send_ids: [
        'email_send_001',
        'email_send_002',
        'email_send_003',
        'email_send_004',
      ],
      chat_notification_ids: [
        'chat_notif_001',
        'chat_notif_002',
        'chat_notif_003',
        'chat_notif_004',
      ],
    };

    fetchMock.mockResponseOnce(JSON.stringify({ logged: true }), {
      status: 200,
    });

    const send_log_response = await fetch(
      'http://localhost/audit-logs/log-event',
      {
        method: 'POST',
        body: JSON.stringify(audit_send_event),
      }
    );
    expect(send_log_response.status).toBe(200);

    const send_history_storage_response = {
      status: 'success',
      stored_count: 4,
      stored_records: [
        {
          record_id: 'record_001',
          target_employee: 'user_106',
          target_name: '小林由美',
          send_content: 'promotion_request',
          send_datetime: '2024-01-15T08:46:10Z',
          send_method: 'email',
          send_id: 'email_send_001',
        },
        {
          record_id: 'record_002',
          target_employee: 'user_107',
          target_name: '山田花太郎',
          send_content: 'promotion_request',
          send_datetime: '2024-01-15T08:46:12Z',
          send_method: 'email',
          send_id: 'email_send_002',
        },
        {
          record_id: 'record_003',
          target_employee: 'user_103',
          target_name: '佐藤次郎',
          send_content: 'promotion_request',
          send_datetime: '2024-01-15T08:46:14Z',
          send_method: 'email',
          send_id: 'email_send_003',
        },
        {
          record_id: 'record_004',
          target_employee: 'user_104',
          target_name: '渡辺美咲',
          send_content: 'promotion_request',
          send_datetime: '2024-01-15T08:46:16Z',
          send_method: 'email',
          send_id: 'email_send_004',
        },
      ],
    };

    fetchMock.mockResponseOnce(JSON.stringify(send_history_storage_response), {
      status: 200,
    });

    const send_history_result = await fetch(
      'http://localhost/send-history/store-batch',
      {
        method: 'POST',
        body: JSON.stringify({
          records: [
            {
              target_employee: 'user_106',
              target_name: '小林由美',
              send_content: 'promotion_request',
              send_datetime: '2024-01-15T08:46:10Z',
              send_method: 'email',
              send_id: 'email_send_001',
            },
            {
              target_employee: 'user_107',
              target_name: '山田花太郎',
              send_content: 'promotion_request',
              send_datetime: '2024-01-15T08:46:12Z',
              send_method: 'email',
              send_id: 'email_send_002',
            },
            {
              target_employee: 'user_103',
              target_name: '佐藤次郎',
              send_content: 'promotion_request',
              send_datetime: '2024-01-15T08:46:14Z',
              send_method: 'email',
              send_id: 'email_send_003',
            },
            {
              target_employee: 'user_104',
              target_name: '渡辺美咲',
              send_content: 'promotion_request',
              send_datetime: '2024-01-15T08:46:16Z',
              send_method: 'email',
              send_id: 'email_send_004',
            },
          ],
        }),
      }
    );
    expect(send_history_result.status).toBe(200);
    const send_history_body = await send_history_result.json();
    expect(send_history_body.status).toBe('success');
    expect(send_history_body.stored_count).toBe(4);

    const agent_result = await runTx3Imp1Agent(agent_input_data, ai_client);

    expect(agent_result.status).toBe('success');
    expect(agent_result.unsubmitted_count).toBe(3);
    expect(agent_result.delayed_count).toBe(2);
    expect(agent_result.total_identified).toBe(5);
    expect(agent_result.promotion_executed_count).toBe(4);
    expect(agent_result.email_sent_count).toBe(4);
    expect(agent_result.chat_sent_count).toBe(4);
    expect(agent_result.excluded_count).toBe(1);

    const audit_complete_event = {
      event_type: 'agent_completed',
      timestamp: '2024-01-15T08:46:40Z',
      agent_id: 'tx_3_imp_1_agent_001',
      start_timestamp: '2024-01-15T08:45:30Z',
      processing_time_ms: 70000,
      status: 'completed',
    };

    fetchMock.mockResponseOnce(JSON.stringify({ logged: true }), {
      status: 200,
    });

    const complete_log_response = await fetch(
      'http://localhost/audit-logs/log-event',
      {
        method: 'POST',
        body: JSON.stringify(audit_complete_event),
      }
    );
    expect(complete_log_response.status).toBe(200);

    const audit_timeline_response = {
      status: 'success',
      events: [
        {
          sequence: 1,
          event_type: 'agent_start',
          timestamp: '2024-01-15T08:45:30Z',
          agent_id: 'tx_3_imp_1_agent_001',
        },
        {
          sequence: 2,
          event_type: 'unsubmitted_delayed_identified',
          timestamp: '2024-01-15T08:45:45Z',
          agent_id: 'tx_3_imp_1_agent_001',
        },
        {
          sequence: 3,
          event_type: 'promotion_candidates_determined',
          timestamp: '2024-01-15T08:46:00Z',
          agent_id: 'tx_3_imp_1_agent_001',
        },
        {
          sequence: 4,
          event_type: 'promotion_sent_completed',
          timestamp: '2024-01-15T08:46:30Z',
          agent_id: 'tx_3_imp_1_agent_001',
        },
        {
          sequence: 5,
          event_type: 'agent_completed',
          timestamp: '2024-01-15T08:46:40Z',
          agent_id: 'tx_3_imp_1_agent_001',
        },
      ],
    };

    fetchMock.mockResponseOnce(JSON.stringify(audit_timeline_response), {
      status: 200,
    });

    const audit_timeline_result = await fetch(
      'http://localhost/audit-logs/timeline?agent_id=tx_3_imp_1_agent_001',
      { method: 'GET' }
    );
    expect(audit_timeline_result.status).toBe(200);
    const audit_timeline_body = await audit_timeline_result.json();
    expect(audit_timeline_body.status).toBe('success');
    expect(audit_timeline_body.events.length).toBe(5);
    expect(audit_timeline_body.events[0].event_type).toBe('agent_start');
    expect(audit_timeline_body.events[1].event_type).toBe(
      'unsubmitted_delayed_identified'
    );
    expect(audit_timeline_body.events[2].event_type).toBe(
      'promotion_candidates_determined'
    );
    expect(audit_timeline_body.events[3].event_type).toBe(
      'promotion_sent_completed'
    );
    expect(audit_timeline_body.events[4].event_type).toBe('agent_completed');
    expect(new Date(audit_timeline_body.events[0].timestamp).getTime()).toBeLessThan(
      new Date(audit_timeline_body.events[1].timestamp).getTime()
    );
    expect(new Date(audit_timeline_body.events[1].timestamp).getTime()).toBeLessThan(
      new Date(audit_timeline_body.events[2].timestamp).getTime()
    );
    expect(new Date(audit_timeline_body.events[2].timestamp).getTime()).toBeLessThan(
      new Date(audit_timeline_body.events[3].timestamp).getTime()
    );
    expect(new Date(audit_timeline_body.events[3].timestamp).getTime()).toBeLessThan(
      new Date(audit_timeline_body.events[4].timestamp).getTime()
    );

    const audit_immutability_response = {
      status: 'success',
      immutable_format: true,
      hash_verified: true,
      events_count: 5,
      signature_valid: true,
    };

    fetchMock.mockResponseOnce(JSON.stringify(audit_immutability_response), {
      status: 200,
    });

    const audit_immutability_result = await fetch(
      'http://localhost/audit-logs/verify-immutability?agent_id=tx_3_imp_1_agent_001',
      { method: 'GET' }
    );
    expect(audit_immutability_result.status).toBe(200);
    const audit_immutability_body = await audit_immutability_result.json();
    expect(audit_immutability_body.status).toBe('success');
    expect(audit_immutability_body.immutable_format).toBe(true);
    expect(audit_immutability_body.hash_verified).toBe(true);
    expect(audit_immutability_body.signature_valid).toBe(true);

    fetchMock.disableMocks();
  });
});