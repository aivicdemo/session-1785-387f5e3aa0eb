import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { notifyUnreportedMembersBeforeMeeting } from "../../src/logic/it-1";

describe("朝会開始前の未報告催促通知機能", () => {
  // SCEN-497
  test("朝会開始15分前に未報告者が1名の場合、部長に対して当該部員名と催促メッセージが通知される", async () => {
    const meetingStartTime = new Date("2024-01-15T09:00:00Z");
    const checkTime = new Date("2024-01-15T08:45:00Z");

    const department_id = "DEV_001";
    const manager_user_id = "USER_MANAGER_001";
    const manager_email = "manager@example.com";

    const reported_member_ids = [
      "USER_MEMBER_001",
      "USER_MEMBER_002",
      "USER_MEMBER_003",
      "USER_MEMBER_004",
      "USER_MEMBER_005",
      "USER_MEMBER_006",
      "USER_MEMBER_007",
      "USER_MEMBER_008",
      "USER_MEMBER_009",
    ];

    const unreported_member_id = "USER_MEMBER_010";
    const unreported_member_name = "部員J";

    const input_params = {
      department_id: department_id,
      meeting_start_time: meetingStartTime,
      check_time: checkTime,
      reported_member_ids: reported_member_ids,
      unreported_member_ids: [unreported_member_id],
      unreported_member_names: [unreported_member_name],
      manager_user_id: manager_user_id,
      manager_email: manager_email,
    };

    const send_notification_result = await notifyUnreportedMembersBeforeMeeting(
      input_params
    );

    expect(send_notification_result).toBeDefined();
    expect(send_notification_result.notification_sent).toBe(true);
    expect(send_notification_result.notification_count).toBe(1);
    expect(send_notification_result.recipient_email).toBe(manager_email);
    expect(send_notification_result.recipient_user_id).toBe(manager_user_id);

    expect(send_notification_result.notification_content).toContain("部員J");
    expect(send_notification_result.notification_content).toMatch(
      /報告がまだ|お急ぎください|15分/
    );
    expect(send_notification_result.time_to_meeting_minutes).toBe(15);
    expect(send_notification_result.unreported_count).toBe(1);
  });
});