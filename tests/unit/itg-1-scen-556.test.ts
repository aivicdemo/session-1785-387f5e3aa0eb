import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import fetchMock from "jest-fetch-mock";
import { runTx3Imp1Agent } from "../../src/agents/tx-3-imp-1/orchestrator";

fetchMock.enableMocks();

describe("朝会報告管理システム - 報告漏れ特定から催促送信までの自動実行 AIエージェント", () => {
  // SCEN-556
  test("確認メール内容から報告漏れ・遅延部員を特定し催促メールを自動送信する", async () => {
    // Arrange: テストデータの準備
    const confirmation_email_content = `
部員報告状況確認 (2024-01-15)

【提出完了】
- 部員A: 2024-01-15 09:00:00 提出完了
- 部員B: 2024-01-15 09:05:00 提出完了
- 部員C: 2024-01-15 09:10:00 提出完了
- 部員E: 2024-01-15 09:02:00 提出完了
- 部員F: 2024-01-15 08:50:00 提出完了
- 部員H: 2024-01-15 09:12:00 提出完了
- 部員I: 2024-01-15 09:03:00 提出完了

【未提出】
- 部員D: 提出なし
- 部員G: 提出なし
- 部員J: 提出なし

朝会開始時刻: 09:30:00
`;

    const mock_ai_client = {
      async identifyUnreportedMembers(email_content: string): Promise<{
        unreported_members: Array<{
          member_id: string;
          member_name: string;
          identification_timestamp: string;
        }>;
        delayed_members: Array<{
          member_id: string;
          member_name: string;
          submission_time: string;
        }>;
      }> {
        return {
          unreported_members: [
            {
              member_id: "D",
              member_name: "部員D",
              identification_timestamp: "2024-01-15T09:15:00Z",
            },
            {
              member_id: "G",
              member_name: "部員G",
              identification_timestamp: "2024-01-15T09:15:00Z",
            },
            {
              member_id: "J",
              member_name: "部員J",
              identification_timestamp: "2024-01-15T09:15:00Z",
            },
          ],
          delayed_members: [],
        };
      },

      async determinePriorityTarget(
        unreported_list: Array<{ member_id: string; member_name: string }>,
        delayed_list: Array<{ member_id: string; member_name: string }>
      ): Promise<{
        priority_targets: Array<{
          member_id: string;
          member_name: string;
          priority_order: number;
          category: "unreported" | "delayed";
        }>;
      }> {
        const targets = [];
        for (let i = 0; i < unreported_list.length; i++) {
          targets.push({
            member_id: unreported_list[i].member_id,
            member_name: unreported_list[i].member_name,
            priority_order: i + 1,
            category: "unreported",
          });
        }
        for (let i = 0; i < delayed_list.length; i++) {
          targets.push({
            member_id: delayed_list[i].member_id,
            member_name: delayed_list[i].member_name,
            priority_order: unreported_list.length + i + 1,
            category: "delayed",
          });
        }
        return { priority_targets: targets };
      },

      async generatePromptsForCitation(
        priority_targets: Array<{
          member_id: string;
          member_name: string;
          priority_order: number;
        }>
      ): Promise<
        Array<{
          member_id: string;
          member_name: string;
          message_content: string;
        }>
      > {
        return priority_targets.map((target) => ({
          member_id: target.member_id,
          member_name: target.member_name,
          message_content: `${target.member_name}へ: 日報提出をお願いします。以下の3項目をご入力ください: (1)昨日やったこと (2)今日やること (3)抱えている課題`,
        }));
      },
    };

    const send_history_log: Array<{
      send_timestamp: string;
      member_id: string;
      member_name: string;
      message_content: string;
      send_status: string;
    }> = [];

    const mock_mail_service = {
      async sendMailToMember(
        member_id: string,
        member_name: string,
        message_content: string
      ): Promise<{ success: boolean; timestamp: string }> {
        return {
          success: true,
          timestamp: new Date().toISOString(),
        };
      },
    };

    const mock_chat_service = {
      async sendChatToMember(
        member_id: string,
        member_name: string,
        message_content: string
      ): Promise<{ success: boolean; timestamp: string }> {
        return {
          success: true,
          timestamp: new Date().toISOString(),
        };
      },
    };

    // Act: AIエージェント実行
    const agent_result = await runTx3Imp1Agent({
      confirmation_email_content,
      ai_client: mock_ai_client,
      mail_service: mock_mail_service,
      chat_service: mock_chat_service,
      send_history_log,
    });

    // Assert: 実行結果の検証
    // (1) 確認メール内容から未提出部員を特定したか
    expect(agent_result.identified_unreported_members).toEqual([
      expect.objectContaining({
        member_id: "D",
        member_name: "部員D",
      }),
      expect.objectContaining({
        member_id: "G",
        member_name: "部員G",
      }),
      expect.objectContaining({
        member_id: "J",
        member_name: "部員J",
      }),
    ]);

    // (2) 催促対象を判定したか
    expect(agent_result.priority_targets).toEqual([
      expect.objectContaining({
        member_id: "D",
        member_name: "部員D",
        priority_order: 1,
        category: "unreported",
      }),
      expect.objectContaining({
        member_id: "G",
        member_name: "部員G",
        priority_order: 2,
        category: "unreported",
      }),
      expect.objectContaining({
        member_id: "J",
        member_name: "部員J",
        priority_order: 3,
        category: "unreported",
      }),
    ]);

    // (3) 催促メッセージを生成したか
    expect(agent_result.generated_prompts).toEqual([
      expect.objectContaining({
        member_id: "D",
        member_name: "部員D",
        message_content: expect.stringContaining("昨日やったこと"),
      }),
      expect.objectContaining({
        member_id: "G",
        member_name: "部員G",
        message_content: expect.stringContaining("昨日やったこと"),
      }),
      expect.objectContaining({
        member_id: "J",
        member_name: "部員J",
        message_content: expect.stringContaining("昨日やったこと"),
      }),
    ]);

    // (4) 催促メール・チャットを送信し、履歴を記録したか
    expect(agent_result.send_results).toHaveLength(6); // 各部員に対してメール+チャット = 6件
    expect(agent_result.send_results).toEqual([
      expect.objectContaining({
        member_id: "D",
        member_name: "部員D",
        channel: "mail",
        send_status: "success",
      }),
      expect.objectContaining({
        member_id: "D",
        member_name: "部員D",
        channel: "chat",
        send_status: "success",
      }),
      expect.objectContaining({
        member_id: "G",
        member_name: "部員G",
        channel: "mail",
        send_status: "success",
      }),
      expect.objectContaining({
        member_id: "G",
        member_name: "部員G",
        channel: "chat",
        send_status: "success",
      }),
      expect.objectContaining({
        member_id: "J",
        member_name: "部員J",
        channel: "mail",
        send_status: "success",
      }),
      expect.objectContaining({
        member_id: "J",
        member_name: "部員J",
        channel: "chat",
        send_status: "success",
      }),
    ]);

    // (5) 送信履歴ログに記録されたか
    expect(send_history_log).toHaveLength(6);
    expect(send_history_log[0]).toEqual(
      expect.objectContaining({
        member_id: "D",
        member_name: "部員D",
        send_status: "success",
      })
    );
    expect(send_history_log[1]).toEqual(
      expect.objectContaining({
        member_id: "D",
        member_name: "部員D",
        send_status: "success",
      })
    );
    expect(send_history_log[2]).toEqual(
      expect.objectContaining({
        member_id: "G",
        member_name: "部員G",
        send_status: "success",
      })
    );
    expect(send_history_log[3]).toEqual(
      expect.objectContaining({
        member_id: "G",
        member_name: "部員G",
        send_status: "success",
      })
    );
    expect(send_history_log[4]).toEqual(
      expect.objectContaining({
        member_id: "J",
        member_name: "部員J",
        send_status: "success",
      })
    );
    expect(send_history_log[5]).toEqual(
      expect.objectContaining({
        member_id: "J",
        member_name: "部員J",
        send_status: "success",
      })
    );

    // (6) 各送信結果にタイムスタンプが含まれているか
    for (const log_entry of send_history_log) {
      expect(log_entry.send_timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
      );
    }

    // (7) エージェント全体の実行ステータスが成功か
    expect(agent_result.status).toBe("success");
    expect(agent_result.completion_timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
  });
});