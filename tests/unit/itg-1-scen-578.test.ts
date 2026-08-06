import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx4Imp1Agent } from "../../src/logic/it-1";

describe("日報収集から課題抽出・優先度判定までの自動実行 AIエージェント", () => {
  // SCEN-578
  test("複数課題の優先度が同等で判定が困難な場合に副作用の確定前に人へ引き継ぐ", async () => {
    // テストデータの準備
    const mockReports = [
      {
        report_id: "RPT001",
        user_id: "ENG001",
        department_id: "DEV",
        yesterday_achievement: "実装テストを進行中",
        today_plan: "実装テスト完了予定",
        issues: "実装テスト未完了",
        sent_at: new Date("2024-01-15T08:00:00Z"),
      },
      {
        report_id: "RPT002",
        user_id: "ENG002",
        department_id: "DEV",
        yesterday_achievement: "API仕様書確認完了",
        today_plan: "API連携実装開始",
        issues: "API連携調査未開始",
        sent_at: new Date("2024-01-15T08:05:00Z"),
      },
      {
        report_id: "RPT003",
        user_id: "ENG003",
        department_id: "DEV",
        yesterday_achievement: "DB設計完了",
        today_plan: "DB実装開始",
        issues: "マイグレーション手順未確定",
        sent_at: new Date("2024-01-15T08:10:00Z"),
      },
      {
        report_id: "RPT004",
        user_id: "ENG004",
        department_id: "DEV",
        yesterday_achievement: "フロント画面実装50%完了",
        today_plan: "フロント画面実装完了予定",
        issues: "スタイル調整が難航中",
        sent_at: new Date("2024-01-15T08:15:00Z"),
      },
      {
        report_id: "RPT005",
        user_id: "ENG005",
        department_id: "DEV",
        yesterday_achievement: "テストケース作成完了",
        today_plan: "テスト実行開始",
        issues: "テストデータ準備が遅延",
        sent_at: new Date("2024-01-15T08:20:00Z"),
      },
    ];

    // スタブAIクライアントの設定
    const mockAiClient = {
      extractIssuesAndCalculatePriority: jest.fn().mockResolvedValue({
        extracted_issues: [
          {
            issue_id: "ISS_001",
            description: "昨日の実装テスト未完了",
            related_report_ids: ["RPT001"],
            priority_score: 50,
            priority_reason: "実装遅延がAPI連携に影響する可能性",
          },
          {
            issue_id: "ISS_002",
            description: "本日のAPI連携調査未開始",
            related_report_ids: ["RPT002"],
            priority_score: 50,
            priority_reason: "スケジュール遅延により他チームに影響する可能性",
          },
          {
            issue_id: "ISS_003",
            description: "マイグレーション手順未確定",
            related_report_ids: ["RPT003"],
            priority_score: 35,
            priority_reason: "本番環境への影響が限定的",
          },
          {
            issue_id: "ISS_004",
            description: "スタイル調整が難航中",
            related_report_ids: ["RPT004"],
            priority_score: 25,
            priority_reason: "品質の問題だが機能リリースに直接影響なし",
          },
          {
            issue_id: "ISS_005",
            description: "テストデータ準備が遅延",
            related_report_ids: ["RPT005"],
            priority_score: 30,
            priority_reason: "テスト進捗に影響するが調整可能",
          },
        ],
        equal_priority_groups: [
          {
            group_id: "EQUAL_GROUP_001",
            issues: ["ISS_001", "ISS_002"],
            score: 50,
            message: "判定スコア同等の課題が存在するため、最終優先度判定は部長の確認が必要",
          },
        ],
      }),
      sendAuditEvent: jest.fn().mockResolvedValue({
        audit_id: "AUD001",
        timestamp: new Date("2024-01-15T09:30:00Z"),
        event_type: "ESCALATION_EQUAL_PRIORITY",
      }),
    };

    // runTx4Imp1Agent関数の実行
    const result = await runTx4Imp1Agent(
      {
        reports: mockReports,
        morning_meeting_start_time: new Date("2024-01-15T09:30:00Z"),
        manager_id: "MGR001",
      },
      mockAiClient
    );

    // エスカレーション条件の確認：優先度判定が同等
    expect(result.escalation_detected).toBe(true);
    expect(result.escalation_type).toBe("equal_priority_judgment");

    // 状態遷移ログの検証
    expect(result.state_transitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from_state: "priority_judging",
          to_state: "awaiting_human_review",
          transition_reason: "equal_priority_detected",
        }),
      ])
    );

    // 部長への提示データの検証
    expect(result.manager_report).toBeDefined();
    expect(result.manager_report.message).toContain(
      "判定スコア同等の課題が存在するため、最終優先度判定は部長の確認が必要"
    );

    // 提示データに含まれる課題情報の検証
    const equal_group = result.manager_report.equal_priority_groups[0];
    expect(equal_group).toBeDefined();
    expect(equal_group.issues.length).toBe(2);
    expect(equal_group.score).toBe(50);

    const issue_001 = result.manager_report.issues.find(
      (i: { issue_id: string }) => i.issue_id === "ISS_001"
    );
    const issue_002 = result.manager_report.issues.find(
      (i: { issue_id: string }) => i.issue_id === "ISS_002"
    );

    expect(issue_001).toEqual(
      expect.objectContaining({
        description: "昨日の実装テスト未完了",
        priority_score: 50,
        priority_reason: "実装遅延がAPI連携に影響する可能性",
      })
    );

    expect(issue_002).toEqual(
      expect.objectContaining({
        description: "本日のAPI連携調査未開始",
        priority_score: 50,
        priority_reason: "スケジュール遅延により他チームに影響する可能性",
      })
    );

    // 監査ログの検証
    expect(mockAiClient.sendAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        event_type: "ESCALATION_EQUAL_PRIORITY",
        target_issue_ids: expect.arrayContaining(["ISS_001", "ISS_002"]),
      })
    );

    const audit_event = result.audit_events.find(
      (e: { event_type: string }) => e.event_type === "ESCALATION_EQUAL_PRIORITY"
    );
    expect(audit_event).toEqual(
      expect.objectContaining({
        timestamp: expect.any(Date),
        agent_execution_id: expect.any(String),
        target_issue_ids: ["ISS_001", "ISS_002"],
      })
    );

    // 副作用実行前の状態確認
    expect(mockAiClient.sendAuditEvent).toHaveBeenCalledTimes(1);
    const send_email_calls = mockAiClient.sendAuditEvent.mock.calls.filter(
      (call: any[]) =>
        call[0]?.method === "sendEmailToManager" ||
        call[0]?.event_type === "EMAIL_SENT"
    );
    expect(send_email_calls.length).toBe(0);

    const db_update_calls = mockAiClient.sendAuditEvent.mock.calls.filter(
      (call: any[]) =>
        call[0]?.method === "updatePriorityStatus" ||
        call[0]?.event_type === "DB_PRIORITY_UPDATED"
    );
    expect(db_update_calls.length).toBe(0);

    // エージェント状態の検証
    expect(result.agent_state).toBe("AWAITING_HUMAN_REVIEW");
    expect(result.next_action_required).toBe("manager_priority_confirmation");
  });
});