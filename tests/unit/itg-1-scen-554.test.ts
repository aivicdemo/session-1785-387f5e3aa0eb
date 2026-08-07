import { runTx2Imp1Agent } from '../../src/agents/tx-2-imp-1/orchestrator';
import type { Tx2Imp1AiClient } from '../../src/agents/tx-2-imp-1/ai-client';
import { getConnection } from '../../src/db/connection';
import { getStubMailService } from '../../src/services/mail-stub';

describe('日報入力フォームの提供と送信機能 - Tx2Imp1Agent ロールバック検証', () => {
  // SCEN-554
  test('AIエージェント途中失敗時に完了済みの副作用を巻き戻すか補償する', async () => {
    // ========== 初期化 ==========
    const dbConnection = getConnection();
    await dbConnection.query('DELETE FROM audit_log');
    await dbConnection.query('DELETE FROM unreported_members');
    await dbConnection.query('DELETE FROM mail_queue');
    await dbConnection.query('DELETE FROM users WHERE department_id = 1');
    await dbConnection.query('DELETE FROM departments WHERE department_id = 1');

    // 部門を作成
    await dbConnection.query(
      `INSERT INTO departments (department_id, name, status) 
       VALUES (1, '開発部', 'active')`
    );

    // 部員10名を作成（全員未提出状態）
    const engineer_ids = [];
    for (let i = 1; i <= 10; i++) {
      const result = await dbConnection.query(
        `INSERT INTO users (user_id, name, email, department_id, role, status) 
         VALUES (?, ?, ?, 1, 'engineer', 'active') RETURNING user_id`,
        [`eng_${i}`, `Engineer ${i}`, `eng${i}@example.com`]
      );
      engineer_ids.push(result[0].user_id);
    }

    // 部長を作成してログイン
    await dbConnection.query(
      `INSERT INTO users (user_id, name, email, department_id, role, status) 
       VALUES ('mgr_001', 'Manager', 'mgr@example.com', 1, 'manager', 'active')`
    );

    const mailService = getStubMailService();
    mailService.clearCallHistory();

    // ========== モック AI クライアント実装 ==========
    const mockAiClient: Tx2Imp1AiClient = {
      checkReceptionStatus: async () => {
        // ステップ(1): 日報受信状況確認 → 成功
        await dbConnection.query(
          `INSERT INTO audit_log (action, actor_id, details, created_at) 
           VALUES ('step_1_reception_check_completed', 'mgr_001', 'チェック成功', NOW())`
        );
        return {
          success: true,
          unreportedUserIds: engineer_ids,
          lateUserIds: [],
          timestamp: new Date('2024-01-15T11:00:00Z'),
        };
      },

      judgeUnreportedMembers: async (unreportedUserIds) => {
        // ステップ(2): 未提出者判定 → 成功
        await dbConnection.query(
          `INSERT INTO audit_log (action, actor_id, details, created_at) 
           VALUES ('step_2_unreported_judgment_completed', 'mgr_001', '判定成功', NOW())`
        );
        return {
          success: true,
          priorityList: unreportedUserIds.map((id, idx) => ({
            userId: id,
            priority: idx + 1,
            reason: 'not_submitted',
          })),
        };
      },

      createUnreportedList: async (priorityList) => {
        // ステップ(3): 一覧作成 → 成功
        const listId = 'unrep_list_001';
        await dbConnection.query(
          `INSERT INTO unreported_members (list_id, user_ids_json, created_at) 
           VALUES (?, ?, NOW())`,
          [listId, JSON.stringify(priorityList.map((p) => p.userId))]
        );
        await dbConnection.query(
          `INSERT INTO audit_log (action, actor_id, details, created_at) 
           VALUES ('step_3_list_creation_completed', 'mgr_001', ?, NOW())`,
          [JSON.stringify({ listId })]
        );
        return {
          success: true,
          listId,
          memberCount: priorityList.length,
        };
      },

      sendNotificationEmail: async (managerUserId, listId, memberCount) => {
        // ステップ(4): メール送信 → 意図的失敗（SMTP エラー）
        await dbConnection.query(
          `INSERT INTO audit_log (action, actor_id, details, created_at) 
           VALUES ('step_4_mail_send_failure_detected', 'mgr_001', 'SMTP接続エラー', NOW())`
        );
        throw new Error('SMTP_CONNECTION_ERROR');
      },
    };

    // ========== ロールバック処理を実装したオーケストレーター呼び出し ==========
    let rollbackStarted = false;
    let rollbackCompleted = false;
    let thrownError: Error | null = null;

    try {
      await runTx2Imp1Agent({
        managerUserId: 'mgr_001',
        departmentId: 1,
        checkTimeUtc: new Date('2024-01-15T11:00:00Z'),
        aiClient: mockAiClient,
        onRollbackStart: async () => {
          rollbackStarted = true;
          await dbConnection.query(
            `INSERT INTO audit_log (action, actor_id, details, created_at) 
             VALUES ('rollback_started', 'mgr_001', 'ロールバック開始', NOW())`
          );
        },
        onRollbackStep: async (unreportedListId: string) => {
          // ロールバック: unreported_members テーブルから該当レコード削除
          await dbConnection.query(
            `DELETE FROM unreported_members WHERE list_id = ?`,
            [unreportedListId]
          );
        },
        onRollbackComplete: async () => {
          rollbackCompleted = true;
          await dbConnection.query(
            `INSERT INTO audit_log (action, actor_id, details, created_at) 
             VALUES ('rollback_completed', 'mgr_001', 'ロールバック完了', NOW())`
          );
        },
      });
    } catch (err) {
      thrownError = err instanceof Error ? err : new Error(String(err));
    }

    // ========== 検証: ロールバック処理が実行されたか ==========
    expect(rollbackStarted).toBe(true);
    expect(rollbackCompleted).toBe(true);
    expect(thrownError).not.toBeNull();
    expect(thrownError?.message).toMatch(/SMTP/);

    // ========== 検証: 副作用が巻き戻されたか ==========
    // 報告漏れ一覧レコードが DBから削除されている
    const unreportedRecords = await dbConnection.query(
      `SELECT COUNT(*) as cnt FROM unreported_members`
    );
    expect(unreportedRecords[0].cnt).toBe(0);

    // メール送信キューに完了タスクが存在しない
    const mailQueueRecords = await dbConnection.query(
      `SELECT COUNT(*) as cnt FROM mail_queue WHERE status = 'sent'`
    );
    expect(mailQueueRecords[0].cnt).toBe(0);

    // ========== 検証: 監査ログに5段階のイベントが記録されているか ==========
    const auditLogs = await dbConnection.query(
      `SELECT action, actor_id, created_at FROM audit_log ORDER BY created_at ASC`
    );

    // 期待するイベント順序
    const expectedActions = [
      'step_1_reception_check_completed',
      'step_2_unreported_judgment_completed',
      'step_3_list_creation_completed',
      'step_4_mail_send_failure_detected',
      'rollback_started',
      'rollback_completed',
    ];

    expect(auditLogs.length).toBe(6);
    for (let i = 0; i < expectedActions.length; i++) {
      expect(auditLogs[i].action).toBe(expectedActions[i]);
      expect(auditLogs[i].actor_id).toBe('mgr_001');
    }

    // ========== 検証: 部長へ通知メールが送信されていないか ==========
    const mailCallHistory = mailService.getCallHistory() as unknown as Array<{ recipient: string; subject: string }>;
    const sentToManager = mailCallHistory.filter(
      (call) =>
        call.recipient === 'mgr@example.com' &&
        call.subject.includes('日報')
    );
    expect(sentToManager.length).toBe(0);

    // ========== 検証: DB 一貫性 ==========
    // unreported_members テーブルが空
    const finalUnreportedCount = await dbConnection.query(
      `SELECT COUNT(*) as cnt FROM unreported_members`
    );
    expect(finalUnreportedCount[0].cnt).toBe(0);

    // 部員レコードは変更されない
    const engineerRecordsAfter = await dbConnection.query(
      `SELECT COUNT(*) as cnt FROM users WHERE role = 'engineer' AND department_id = 1`
    );
    expect(engineerRecordsAfter[0].cnt).toBe(10);
  });
});