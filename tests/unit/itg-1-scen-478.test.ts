import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import {
  sendConfirmationEmailsForReports,
  type SendConfirmationEmailsInput,
} from "../../src/logic/it-1-br-1-1-1";

const fetchMock = require("jest-fetch-mock");

describe("朝会報告内容検証・集約機能 - 複数報告の統一フォーマット確認とメール配信", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-478
  it("複数の部員からの報告（3件）がすべて正常フォーマットで集約対象として承認され、管理者へ1通のメールが送信される", async () => {
    // 準備: 3名の部員からの報告データを構成
    const user_employee_a_id = "EMP001";
    const user_employee_b_id = "EMP002";
    const user_employee_c_id = "EMP003";
    const admin_email = "admin@company.example.com";
    const submission_date = "2024-01-15";
    const submission_time_a = "2024-01-15T08:30:00Z";
    const submission_time_b = "2024-01-15T08:35:00Z";
    const submission_time_c = "2024-01-15T08:40:00Z";

    // 部員Aの報告
    const report_a: SendConfirmationEmailsInput["reports"][number] = {
      user_id: user_employee_a_id,
      yesterday_results: "APIのエラーハンドリング実装を完了した",
      today_plans: "ユーザー認証機能のテストを実施する予定",
      challenges: "データベース接続のタイムアウト問題に対応中",
      submission_timestamp: submission_time_a,
      submission_date: submission_date,
    };

    // 部員Bの報告
    const report_b: SendConfirmationEmailsInput["reports"][number] = {
      user_id: user_employee_b_id,
      yesterday_results: "UI画面の修正とレイアウト調整を完了した",
      today_plans: "新機能の画面デザイン案を作成する",
      challenges: "フロントエンドフレームワークのバージョン互換性問題",
      submission_timestamp: submission_time_b,
      submission_date: submission_date,
    };

    // 部員Cの報告
    const report_c: SendConfirmationEmailsInput["reports"][number] = {
      user_id: user_employee_c_id,
      yesterday_results: "ドキュメント更新とコードレビューを実施した",
      today_plans: "デプロイメントの準備とテスト環境の構築",
      challenges: "本番環境でのログ出力レベルの設定",
      submission_timestamp: submission_time_c,
      submission_date: submission_date,
    };

    const input: SendConfirmationEmailsInput = {
      reports: [report_a, report_b, report_c],
      admin_email_address: admin_email,
      report_submission_date: submission_date,
    };

    // メール送信APIのレスポンスをモック
    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: "sent",
        message_id: "msg_20240115_001",
        recipient_count: 1,
      }),
      { status: 200 }
    );

    // 実行: 確認メール送信処理
    const result = await sendConfirmationEmailsForReports(input);

    // 検証1: 戻り値が成功を示すこと
    expect(result.success).toBe(true);
    expect(result.email_sent_count).toBe(1);

    // 検証2: メール送信APIが1回呼び出されたこと
    expect(fetchMock.mock.calls.length).toBe(1);

    // 検証3: メール送信APIの呼び出し詳細を検証
    const email_api_call = fetchMock.mock.calls[0];
    expect(email_api_call[0]).toContain("/mail/send");

    // メール送信リクエストボディを解析
    const request_body = JSON.parse(email_api_call[1].body);
    expect(request_body.to).toBe(admin_email);
    expect(request_body.subject).toContain("朝会報告");

    // 検証4: メール本文に3件の報告がすべて統一フォーマットで含まれていること
    const email_body = request_body.body;

    // 部員Aの報告内容を検証
    expect(email_body).toContain(
      report_a.yesterday_results
    );
    expect(email_body).toContain(
      report_a.today_plans
    );
    expect(email_body).toContain(
      report_a.challenges
    );

    // 部員Bの報告内容を検証
    expect(email_body).toContain(
      report_b.yesterday_results
    );
    expect(email_body).toContain(
      report_b.today_plans
    );
    expect(email_body).toContain(
      report_b.challenges
    );

    // 部員Cの報告内容を検証
    expect(email_body).toContain(
      report_c.yesterday_results
    );
    expect(email_body).toContain(
      report_c.today_plans
    );
    expect(email_body).toContain(
      report_c.challenges
    );

    // 検証5: 統一フォーマット構造が維持されていることを確認
    // 各報告に3項目ラベルが含まれていることを検証
    expect(email_body).toContain("昨日やったこと");
    expect(email_body).toContain("今日やること");
    expect(email_body).toContain("抱えている課題");

    // 検証6: 報告件数が正しく集約されていることを確認
    expect(result.processed_report_count).toBe(3);
    expect(result.approved_report_count).toBe(3);
  });
});