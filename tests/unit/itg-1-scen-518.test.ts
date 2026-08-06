import { sendUnreportedEmployeeNotificationToManager } from "../../src/logic/it-1-br-1-1-1";

const fetchMock = require("jest-fetch-mock");

describe("未報告部員催促通知機能", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    jest.clearAllMocks();
  });

  // SCEN-518
  test("朝会開始予定時刻の15分前ちょうどの時点で未報告者が1名以上いる場合、催促メッセージが部長に通知される", async () => {
    const morning_meeting_scheduled_time = new Date("2024-01-15T09:00:00Z");
    const current_time = new Date("2024-01-15T08:45:00Z");
    const department_id = "dept_001";
    const manager_user_id = "user_manager_001";
    const manager_email = "manager@company.com";
    const unreported_employee_id = "user_emp_a";
    const unreported_employee_name = "部員A";
    const reported_employee_ids = [
      "user_emp_b",
      "user_emp_c",
      "user_emp_d",
      "user_emp_e",
      "user_emp_f",
      "user_emp_g",
      "user_emp_h",
      "user_emp_i",
      "user_emp_j",
    ];

    const employees_status = [
      {
        user_id: unreported_employee_id,
        name: unreported_employee_name,
        email: "emp_a@company.com",
        has_reported: false,
      },
      {
        user_id: reported_employee_ids[0],
        name: "部員B",
        email: "emp_b@company.com",
        has_reported: true,
        reported_at: new Date("2024-01-15T08:30:00Z"),
      },
      {
        user_id: reported_employee_ids[1],
        name: "部員C",
        email: "emp_c@company.com",
        has_reported: true,
        reported_at: new Date("2024-01-15T08:20:00Z"),
      },
      {
        user_id: reported_employee_ids[2],
        name: "部員D",
        email: "emp_d@company.com",
        has_reported: true,
        reported_at: new Date("2024-01-15T08:15:00Z"),
      },
      {
        user_id: reported_employee_ids[3],
        name: "部員E",
        email: "emp_e@company.com",
        has_reported: true,
        reported_at: new Date("2024-01-15T08:10:00Z"),
      },
      {
        user_id: reported_employee_ids[4],
        name: "部員F",
        email: "emp_f@company.com",
        has_reported: true,
        reported_at: new Date("2024-01-15T08:05:00Z"),
      },
      {
        user_id: reported_employee_ids[5],
        name: "部員G",
        email: "emp_g@company.com",
        has_reported: true,
        reported_at: new Date("2024-01-15T08:00:00Z"),
      },
      {
        user_id: reported_employee_ids[6],
        name: "部員H",
        email: "emp_h@company.com",
        has_reported: true,
        reported_at: new Date("2024-01-15T07:50:00Z"),
      },
      {
        user_id: reported_employee_ids[7],
        name: "部員I",
        email: "emp_i@company.com",
        has_reported: true,
        reported_at: new Date("2024-01-15T07:40:00Z"),
      },
      {
        user_id: reported_employee_ids[8],
        name: "部員J",
        email: "emp_j@company.com",
        has_reported: true,
        reported_at: new Date("2024-01-15T07:30:00Z"),
      },
    ];

    fetchMock.mockResponseOnce(
      JSON.stringify({
        user_id: manager_user_id,
        email: manager_email,
        name: "部長",
        role: "manager",
      }),
      { status: 200 }
    );

    fetchMock.mockResponseOnce(
      JSON.stringify({
        department_id: department_id,
        morning_meeting_scheduled_time: morning_meeting_scheduled_time.toISOString(),
      }),
      { status: 200 }
    );

    fetchMock.mockResponseOnce(JSON.stringify(employees_status), {
      status: 200,
    });

    fetchMock.mockResponseOnce(JSON.stringify({ success: true }), {
      status: 200,
    });

    const result = await sendUnreportedEmployeeNotificationToManager({
      manager_user_id: manager_user_id,
      department_id: department_id,
      current_time: current_time,
      morning_meeting_scheduled_time: morning_meeting_scheduled_time,
    });

    expect(result.notification_sent).toBe(true);
    expect(result.recipient_email).toBe(manager_email);
    expect(result.email_subject).toMatch(/朝会開始15分前：未報告部員のお知らせ/);
    expect(result.email_body).toContain(unreported_employee_name);
    expect(result.sent_at).toEqual(current_time);
    expect(result.unreported_employees).toHaveLength(1);
    expect(result.unreported_employees[0]).toEqual({
      user_id: unreported_employee_id,
      name: unreported_employee_name,
    });
    expect(result.total_employees).toBe(10);
    expect(result.reported_employees_count).toBe(9);
    expect(fetchMock.mock.calls).toHaveLength(4);
  });
});