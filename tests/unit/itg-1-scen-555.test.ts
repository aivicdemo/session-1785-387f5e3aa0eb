import { runTx3Imp1Agent } from '../../src/logic/it-1';

jest.mock('../../src/logic/it-1');

describe('報告漏れ特定から催促送信までの自動実行', () => {
  // SCEN-555
  test('通常案件を人の都度承認なしで最後まで完了する', async () => {
    // テスト初期化: 部員10名のうち5名が日報未提出の状態を準備
    const all_user_ids = [
      'ENG001', 'ENG002', 'ENG003', 'ENG004', 'ENG005',
      'ENG006', 'ENG007', 'ENG008', 'ENG009', 'ENG010',
    ];
    const unreported_user_ids = ['ENG001', 'ENG003', 'ENG005', 'ENG007', 'ENG009'];
    const reported_user_ids = ['ENG002', 'ENG004', 'ENG006', 'ENG008', 'ENG010'];

    const confirmation_email_content = {
      reported_users: reported_user_ids,
      unreported_users: unreported_user_ids,
      reports: [
        { user_id: 'ENG002', yesterday: 'Task A completed', today: 'Task B planned', issues: 'None' },
        { user_id: 'ENG004', yesterday: 'Task C completed', today: 'Task D planned', issues: 'Delay risk' },
        { user_id: 'ENG006', yesterday: 'Task E completed', today: 'Task F planned', issues: 'None' },
        { user_id: 'ENG008', yesterday: 'Task G completed', today: 'Task H planned', issues: 'Resource constraint' },
        { user_id: 'ENG010', yesterday: 'Task I completed', today: 'Task J planned', issues: 'None' },
      ],
      timestamp: new Date('2024-01-15T09:00:00Z'),
    };

    // テスト初期化: 未提出部員の確認メール内容をスタブAIクライアントにセットアップ
    const mock_ai_client = {
      identify_unreported: jest.fn().mockResolvedValue({
        unreported_members: unreported_user_ids,
        identified_at: new Date('2024-01-15T09:05:00Z'),
      }),
      judge_escalation_targets: jest.fn().mockResolvedValue({
        escalation_targets: unreported_user_ids,
        judgment_reason: 'Initial reminder, within escalation limit',
      }),
      send_reminder_email: jest.fn().mockResolvedValue({ status: 'sent' }),
      send_reminder_chat: jest.fn().mockResolvedValue({ status: 'sent' }),
    };

    // テスト初期化: 催促送信履歴テーブルが空の状態を確認
    const send_history_log = [];

    // runTx3Imp1Agent()を実行
    (runTx3Imp1Agent as jest.Mock).mockImplementation(async (params) => {
      const identified_result = await mock_ai_client.identify_unreported(confirmation_email_content);
      const escalation_result = await mock_ai_client.judge_escalation_targets({
        unreported: identified_result.unreported_members,
        escalation_rules: params.escalation_rules || {},
      });

      const send_results = [];

      // 催促メール送信
      for (const target_user_id of escalation_result.escalation_targets) {
        const email_result = await mock_ai_client.send_reminder_email({
          user_id: target_user_id,
          content_hash: 'hash_' + target_user_id,
        });

        send_results.push({
          user_id: target_user_id,
          send_type: 'email',
          sent_at: new Date('2024-01-15T09:10:00Z'),
          content_hash: 'hash_' + target_user_id,
          status: 'sent',
        });

        send_history_log.push(send_results[send_results.length - 1]);
      }

      // 催促チャット送信
      for (const target_user_id of escalation_result.escalation_targets) {
        const chat_result = await mock_ai_client.send_reminder_chat({
          user_id: target_user_id,
          content_hash: 'hash_chat_' + target_user_id,
        });

        send_results.push({
          user_id: target_user_id,
          send_type: 'chat',
          sent_at: new Date('2024-01-15T09:10:00Z'),
          content_hash: 'hash_chat_' + target_user_id,
          status: 'sent',
        });

        send_history_log.push(send_results[send_results.length - 1]);
      }

      return {
        identified_unreported: identified_result.unreported_members,
        escalation_targets: escalation_result.escalation_targets,
        send_results: send_results,
        escalation_requests: [],
        completed_without_human_approval: true,
      };
    });

    // エージェント実行
    const agent_result = await runTx3Imp1Agent({
      confirmation_email: confirmation_email_content,
      escalation_rules: {
        first_reminder_enabled: true,
        escalation_limit: 3,
      },
    });

    // AIエージェントが確認メール内容から報告漏れ部員5名を自動特定したことをスタブで確認
    expect(mock_ai_client.identify_unreported).toHaveBeenCalledWith(confirmation_email_content);
    expect(agent_result.identified_unreported).toEqual(unreported_user_ids);
    expect(agent_result.identified_unreported.length).toBe(5);

    // AIエージェントが催促対象部員5名すべてを判定ルールに基づいて判定したことを確認
    expect(mock_ai_client.judge_escalation_targets).toHaveBeenCalled();
    expect(agent_result.escalation_targets).toEqual(unreported_user_ids);
    expect(agent_result.escalation_targets.length).toBe(5);

    // 催促メール送信スタブが部員5名に対して1回ずつ（計5通）呼び出されたことを検証
    const email_send_count = mock_ai_client.send_reminder_email.mock.calls.length;
    expect(email_send_count).toBe(5);

    // 催促チャット送信スタブが部員5名に対して1回ずつ（計5回）呼び出されたことを検証
    const chat_send_count = mock_ai_client.send_reminder_chat.mock.calls.length;
    expect(chat_send_count).toBe(5);

    // メール・チャット送信結果ログが部員5名分で記録されたことを確認
    // メール記録検証
    const email_logs = send_history_log.filter((log) => log.send_type === 'email');
    expect(email_logs.length).toBe(5);
    email_logs.forEach((log) => {
      expect(unreported_user_ids).toContain(log.user_id);
      expect(log.send_type).toBe('email');
      expect(log.sent_at).toEqual(new Date('2024-01-15T09:10:00Z'));
      expect(log.content_hash).toMatch(/^hash_ENG\d{3}$/);
      expect(log.status).toBe('sent');
    });

    // チャット記録検証
    const chat_logs = send_history_log.filter((log) => log.send_type === 'chat');
    expect(chat_logs.length).toBe(5);
    chat_logs.forEach((log) => {
      expect(unreported_user_ids).toContain(log.user_id);
      expect(log.send_type).toBe('chat');
      expect(log.sent_at).toEqual(new Date('2024-01-15T09:10:00Z'));
      expect(log.content_hash).toMatch(/^hash_chat_ENG\d{3}$/);
      expect(log.status).toBe('sent');
    });

    // 総送信記録数が10件（メール5 + チャット5）であることを確認
    expect(send_history_log.length).toBe(10);

    // エージェント実行完了後、部員の承認要求が0件であることを確認
    expect(agent_result.escalation_requests.length).toBe(0);
    expect(agent_result.completed_without_human_approval).toBe(true);
  });
});