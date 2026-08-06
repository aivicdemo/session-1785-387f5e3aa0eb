import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { sendConfirmationEmailsToDepartmentHead } from "../../src/logic/it-1-br-1-1-1";

const fetchMock = require("jest-fetch-mock");

describe("朝会開始前の日報送信状況確認・部長通知機能", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-201
  test("朝会開始予定時刻が null のとき、送信状況の確認処理がエラーになる", () => {
    const input = {
      morningMeetingScheduledTime: null,
      departmentHeadUserId: "user_dept_head_001",
      reportSubmissionRecords: [
        {
          reportId: "report_001",
          userId: "user_engineer_001",
          submittedAt: new Date("2024-01-15T08:00:00Z"),
          status: "submitted",
        },
        {
          reportId: "report_002",
          userId: "user_engineer_002",
          submittedAt: null,
          status: "not_submitted",
        },
      ],
    };

    expect(() => sendConfirmationEmailsToDepartmentHead(input)).toThrow(
      /朝会開始予定時刻/
    );
  });
});