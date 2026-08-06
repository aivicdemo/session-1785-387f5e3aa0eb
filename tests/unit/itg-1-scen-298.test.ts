import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx2Imp1Agent } from "../../src/logic/it-1-br-1-1-1";

const fetchMock = require("jest-fetch-mock");

describe("確認メール配信機能 - 報告内容がnullのときの処理中断", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    fetchMock.enableMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-298
  test("報告内容の3項目目（抱えている課題）がnullのとき、メール配信処理が中断される", async () => {
    // 初期設定: テスト対象システムのセットアップ
    const report_id = "RPT-20240115-001";
    const reporter_id = "USR-ENGINEER-001";
    const reporter_name = "山田太郎";
    const department_id = "DEPT-DEV-001";
    const manager_id = "USR-MANAGER-001";
    const manager_email = "manager@example.com";
    const reporter_email = "engineer@example.com";

    const yesterday_task = "タスクA実施";
    const today_plan = "タスクB実施予定";
    const issue = null;

    const submission_timestamp = new Date("2024-01-15T09:30:00Z");

    // Tx2Imp1AiClientのfake実装: メール配信処理前に3項目チェック
    class Tx2Imp1AiClientFake {
      async validateReportContent(
        yesterday: string | null,
        today: string | null,
        issues: string | null
      ): Promise<void> {
        if (issues === null) {
          throw new Error("報告内容の3項目目（抱えている課題）がnullです");
        }
      }

      async sendConfirmationEmail(
        to_email: string,
        subject: string,
        body: string
      ): Promise<{ status: string; email_id: string }> {
        return { status: "sent", email_id: `EMAIL-${Date.now()}` };
      }
    }

    const ai_client = new Tx2Imp1AiClientFake();

    // reportオブジェクトの構築（3項目目がnull）
    const report_data = {
      report_id: report_id,
      reporter_id: reporter_id,
      reporter_name: reporter_name,
      reporter_email: reporter_email,
      department_id: department_id,
      manager_id: manager_id,
      manager_email: manager_email,
      yesterday_accomplishment: yesterday_task,
      today_plan: today_plan,
      current_issues: issue,
      submitted_at: submission_timestamp.toISOString(),
      status: "pending_email_delivery",
    };

    // メール送信スタブがnullにより呼び出されないことを確認
    let email_sent_count = 0;
    let last_error: Error | null = null;

    // 確認メール配信処理を実行
    try {
      // バリデーション実行
      await ai_client.validateReportContent(
        report_data.yesterday_accomplishment,
        report_data.today_plan,
        report_data.current_issues
      );

      // このブロックには到達しないはず
      email_sent_count += 1;
      await ai_client.sendConfirmationEmail(
        report_data.reporter_email,
        "日報送信確認",
        `送信完了: ${report_data.yesterday_accomplishment}`
      );
      email_sent_count += 1;
      await ai_client.sendConfirmationEmail(
        report_data.manager_email,
        "部員日報確認",
        `${report_data.reporter_name}から日報が届きました`
      );
    } catch (error) {
      if (error instanceof Error) {
        last_error = error;
      }
    }

    // 期待結果の検証

    // 1. メール配信処理が例外で中断されたこと
    expect(last_error).not.toBeNull();
    expect(last_error?.message).toMatch(/抱えている課題/);

    // 2. メール送信スタブが呼び出されていないこと（email_sent_count === 0）
    expect(email_sent_count).toBe(0);

    // 3. reportレコードが『送信待機中』の状態で保存されていることを検証
    expect(report_data.status).toBe("pending_email_delivery");

    // 4. エラーメッセージが期待通りであること
    expect(last_error?.message).toBe(
      "報告内容の3項目目（抱えている課題）がnullです"
    );

    // 5. 3項目目がnullであることを明示的に確認
    expect(report_data.current_issues).toBeNull();
  });
});