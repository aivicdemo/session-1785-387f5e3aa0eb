import { runTx3Imp1Agent } from '../../src/agents/tx-3-imp-1/orchestrator';
import type { Tx3Imp1AiClient } from '../../src/agents/tx-3-imp-1/orchestrator';

describe('日報入力フォームの提供と送信機能', () => {
  // SCEN-557: [normal] 報告漏れ特定から催促送信までの自動実行 AIエージェント
  test('催促対象部員を判定する自律アクションが確認メール解析結果から報告漏れ部員を正確に判定し、催促対象一覧を返却する', async () => {
    // テストデータ: 確認メール内容（報告漏れ部員3名、提出済み部員7名）
    const confirmation_email_content = {
      sent_at: '2024-01-15T08:45:00Z',
      total_members: 10,
      submitted_count: 7,
      missing_count: 3,
      submitted_members: [
        { member_id: 'M001', member_name: 'Engineer A', submitted_at: '2024-01-15T08:00:00Z' },
        { member_id: 'M002', member_name: 'Engineer B', submitted_at: '2024-01-15T08:15:00Z' },
        { member_id: 'M003', member_name: 'Engineer C', submitted_at: '2024-01-15T08:30:00Z' },
        { member_id: 'M004', member_name: 'Engineer D', submitted_at: '2024-01-15T07:45:00Z' },
        { member_id: 'M005', member_name: 'Engineer E', submitted_at: '2024-01-15T08:20:00Z' },
        { member_id: 'M006', member_name: 'Engineer F', submitted_at: '2024-01-15T08:10:00Z' },
        { member_id: 'M007', member_name: 'Engineer G', submitted_at: '2024-01-15T08:25:00Z' },
      ],
      missing_members: [
        { member_id: 'M008', member_name: 'Engineer H' },
        { member_id: 'M009', member_name: 'Engineer I' },
        { member_id: 'M010', member_name: 'Engineer J' },
      ],
      delayed_members: [],
    };

    // 催促対象判定ルール: 同一日の重複催促なし、催促回数上限3回以内
    const promotion_history = {
      'M008': { promotion_date: '2024-01-14', promotion_count: 0 },
      'M009': { promotion_date: '2024-01-14', promotion_count: 1 },
      'M010': { promotion_date: '2024-01-14', promotion_count: 0 },
    };

    // モック AI クライアント設定
    const mock_ai_client: Tx3Imp1AiClient = {
      analyzeConfirmationEmailContent: async (email_content: any) => ({
        analysis_result: email_content,
        timestamp: '2024-01-15T08:45:00Z',
      }),
      judgePromotionTargetMembers: async (analyzed_result: any, history: any) => ({
        promotion_targets: [
          {
            member_id: 'M008',
            member_name: 'Engineer H',
            report_missing_reason_code: 'NO_SUBMISSION',
            current_promotion_count: 0,
            judgment_datetime: '2024-01-15T08:50:00Z',
          },
          {
            member_id: 'M009',
            member_name: 'Engineer I',
            report_missing_reason_code: 'NO_SUBMISSION',
            current_promotion_count: 1,
            judgment_datetime: '2024-01-15T08:50:00Z',
          },
          {
            member_id: 'M010',
            member_name: 'Engineer J',
            report_missing_reason_code: 'NO_SUBMISSION',
            current_promotion_count: 0,
            judgment_datetime: '2024-01-15T08:50:00Z',
          },
        ],
        judgment_timestamp: '2024-01-15T08:50:00Z',
        validation_status: 'PASSED',
      }),
      sendPromotionMessages: async (targets: any) => ({
        sent_messages: targets.map((t: any) => ({
          recipient_id: t.member_id,
          message_type: 'EMAIL',
          sent_at: '2024-01-15T08:51:00Z',
          status: 'SENT',
        })),
        total_sent: targets.length,
      }),
      logAuditEvent: async (event: any) => ({
        event_id: 'EVT_' + Date.now(),
        logged_at: '2024-01-15T08:51:00Z',
        status: 'LOGGED',
      }),
    };

    // オーケストレーター実行
    const orchestration_result = await runTx3Imp1Agent(
      {
        confirmation_email_content: confirmation_email_content,
        promotion_history: promotion_history,
        ai_client: mock_ai_client,
      }
    );

    // (1) 催促対象部員ID 3件を検証
    expect(orchestration_result.promotion_targets).toHaveLength(3);
    expect(orchestration_result.promotion_targets.map((t: any) => t.member_id)).toEqual(
      expect.arrayContaining(['M008', 'M009', 'M010'])
    );

    // (2) 各部員の報告漏れ理由コードを検証
    orchestration_result.promotion_targets.forEach((target: any) => {
      expect(target.report_missing_reason_code).toBe('NO_SUBMISSION');
    });

    // (3) 各部員の現在催促回数を検証（初回催促のため初期値）
    expect(orchestration_result.promotion_targets[0].current_promotion_count).toBe(0); // M008: 初回
    expect(orchestration_result.promotion_targets[1].current_promotion_count).toBe(1); // M009: 2回目
    expect(orchestration_result.promotion_targets[2].current_promotion_count).toBe(0); // M010: 初回

    // (4) 判定日時が UTC ISO8601 形式で記録されていることを検証
    orchestration_result.promotion_targets.forEach((target: any) => {
      expect(target.judgment_datetime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    });

    // 判定結果に含まれる催促対象部員の一覧が確認メール解析結果と一致していることを確認
    expect(orchestration_result.promotion_targets.length).toBe(
      confirmation_email_content.missing_count
    );

    // 同一日の重複判定がないことを確認（同一部員が複数回判定されていない）
    const member_ids_set = new Set(orchestration_result.promotion_targets.map((t: any) => t.member_id));
    expect(member_ids_set.size).toBe(orchestration_result.promotion_targets.length);

    // 催促回数上限 3 回以内の条件を満たしていることを確認
    orchestration_result.promotion_targets.forEach((target: any) => {
      expect(target.current_promotion_count).toBeLessThanOrEqual(3);
    });

    // 判定処理中にシステムエラーが発生していないことを確認
    expect(orchestration_result.validation_status).toBe('PASSED');
    expect(orchestration_result.error).toBeUndefined();
  });
});