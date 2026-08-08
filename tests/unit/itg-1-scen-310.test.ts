import { type Tx2Imp1AiClient } from "../../src/agents/tx-2-imp-1/orchestrator";
import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { runTx2Imp1Agent } from "../../src/agents/tx-2-imp-1/orchestrator";

import {
  sendConfirmationEmail,
  aggregateDailyReports,
} from "../../src/logic/it-1-br-1-1-1";

interface User {
  user_id: string;
  user_name: string;
  department_id: string;
  email: string;
  role: string;
}

interface DailyReport {
  report_id: string;
  user_id: string;
  report_date: string;
  yesterday_achievements: string;
  today_plans: string;
  current_issues: string;
}

interface SubmissionHistory {
  history_id: string;
  report_id: string;
  user_id: string;
  submission_date: string;
  submission_time: string;
  submission_status: "completed" | "pending" | "failed";
}

interface EmailLog {
  log_id: string;
  recipient_email: string;
  subject: string;
  body: string;
  sent_at: string;
  status: "completed" | "failed";
}

interface MockDatabase {
  users: User[];
  daily_reports: DailyReport[];
  submission_history: SubmissionHistory[];
  email_logs: EmailLog[];
}

const mockDatabase: MockDatabase = {
  users: [],
  daily_reports: [],
  submission_history: [],
  email_logs: [],
};

const fakeTx2Imp1AiClient: Tx2Imp1AiClient = {
  checkSubmissionStatus: async () => ({
    total_users: 10,
    submitted_count: 10,
    not_submitted_count: 0,
    delayed_count: 0,
    not_submitted_users: [],
    delayed_users: [],
  }),
  generateNotificationMessage: async () => ({
    message:
      "全員から日報が提出されました。確認メールを配信します。",
  }),
};

describe("it-1-br-1-1-1: 報告送信時に送信者本人と部長宛に確認メールを自動配信する機能", () => {
  beforeEach(() => {
    mockDatabase.users = [];
    mockDatabase.daily_reports = [];
    mockDatabase.submission_history = [];
    mockDatabase.email_logs = [];

    const department_manager_user: User = {
      user_id: "U-DEPT-001",
      user_name: "部長太郎",
      department_id: "D-001",
      email: "manager@example.com",
      role: "manager",
    };
    mockDatabase.users.push(department_manager_user);

    for (let i = 1; i <= 10; i++) {
      const user: User = {
        user_id: `U-ENG-${String(i).padStart(3, "0")}`,
        user_name: `エンジニア${i}`,
        department_id: "D-001",
        email: `engineer${i}@example.com`,
        role: "engineer",
      };
      mockDatabase.users.push(user);
    }

    const report_date = "2024-01-15";
    for (let i = 1; i <= 10; i++) {
      const user_id = `U-ENG-${String(i).padStart(3, "0")}`;
      const report_id = `R-${String(i).padStart(3, "0")}`;

      const daily_report: DailyReport = {
        report_id: report_id,
        user_id: user_id,
        report_date: report_date,
        yesterday_achievements: `${i}日目の実績: タスクA完了、ドキュメント作成`,
        today_plans: `${i}日目の予定: タスクB開始、コードレビュー実施`,
        current_issues: `${i}日目の課題: 外部APIの遅延、チームメンバーの欠席`,
      };
      mockDatabase.daily_reports.push(daily_report);

      const submission_history: SubmissionHistory = {
        history_id: `H-${String(i).padStart(3, "0")}`,
        report_id: report_id,
        user_id: user_id,
        submission_date: "2024-01-15",
        submission_time: `09:${String(i * 5).padStart(2, "0")}:00`,
        submission_status: "completed",
      };
      mockDatabase.submission_history.push(submission_history);
    }
  });

  afterEach(() => {
    mockDatabase.users = [];
    mockDatabase.daily_reports = [];
    mockDatabase.submission_history = [];
    mockDatabase.email_logs = [];
  });

  // SCEN-310
  test("全員（10名）から日報が提出されたとき、確認メールに全10名分の日報が集約されて1通配信される", async () => {
    const report_date = "2024-01-15";
    const morning_meeting_time = new Date("2024-01-15T09:00:00Z");

    const aggregation_result = aggregateDailyReports({
      database: mockDatabase,
      report_date: report_date,
      morning_meeting_time: morning_meeting_time,
    });

    expect(aggregation_result.total_submitted).toBe(10);
    expect(aggregation_result.total_not_submitted).toBe(0);
    expect(aggregation_result.total_delayed).toBe(0);
    expect(aggregation_result.reports.length).toBe(10);

    const reports_subset = aggregation_result.reports.slice(0, 3);
    for (const report_entry of reports_subset) {
      expect(report_entry).toHaveProperty("report_id");
      expect(report_entry).toHaveProperty("user_id");
      expect(report_entry).toHaveProperty("user_name");
      expect(report_entry).toHaveProperty("yesterday_achievements");
      expect(report_entry).toHaveProperty("today_plans");
      expect(report_entry).toHaveProperty("current_issues");
      expect(report_entry).toHaveProperty("submission_time");

      expect(typeof report_entry.report_id).toBe("string");
      expect(typeof report_entry.user_id).toBe("string");
      expect(typeof report_entry.user_name).toBe("string");
      expect(typeof report_entry.yesterday_achievements).toBe("string");
      expect(typeof report_entry.today_plans).toBe("string");
      expect(typeof report_entry.current_issues).toBe("string");
    }

    const manager_user = mockDatabase.users.find((u) => u.role === "manager");
    expect(manager_user).toBeDefined();
    expect(manager_user?.email).toBe("manager@example.com");

    const confirmation_email_result = sendConfirmationEmail({
      database: mockDatabase,
      aggregation_result: aggregation_result,
      manager_email: manager_user!.email,
      report_date: report_date,
    });

    expect(confirmation_email_result.success).toBe(true);
    expect(confirmation_email_result.email_log_id).toBeDefined();
    expect(typeof confirmation_email_result.email_log_id).toBe("string");

    const sent_email_log = mockDatabase.email_logs.find(
      (log) =>
        log.log_id === confirmation_email_result.email_log_id &&
        log.status === "completed"
    );
    expect(sent_email_log).toBeDefined();
    expect(sent_email_log?.recipient_email).toBe("manager@example.com");
    expect(sent_email_log?.status).toBe("completed");

    const email_body = sent_email_log?.body || "";
    for (let i = 1; i <= 10; i++) {
      const user_name = `エンジニア${i}`;
      expect(email_body).toContain(user_name);
    }

    for (let i = 1; i <= 10; i++) {
      const achievement_text = `${i}日目の実績: タスクA完了、ドキュメント作成`;
      expect(email_body).toContain(achievement_text);
    }

    for (let i = 1; i <= 10; i++) {
      const plan_text = `${i}日目の予定: タスクB開始、コードレビュー実施`;
      expect(email_body).toContain(plan_text);
    }

    for (let i = 1; i <= 10; i++) {
      const issue_text = `${i}日目の課題: 外部APIの遅延、チームメンバーの欠席`;
      expect(email_body).toContain(issue_text);
    }

    const email_logs_for_date = mockDatabase.email_logs.filter((log) =>
      log.sent_at.startsWith("2024-01-15")
    );
    expect(email_logs_for_date.length).toBe(1);

    const completed_email_logs = mockDatabase.email_logs.filter(
      (log) => log.status === "completed"
    );
    expect(completed_email_logs.length).toBe(1);
    expect(completed_email_logs[0].recipient_email).toBe("manager@example.com");
  });
});