import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  generateRemindMessage,
  sendReminderEmail,
} from "../../src/logic/it-1-br-1-1-1";

const fetchMock = require("jest-fetch-mock");

describe("未報告催促メール通知機能", () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-512
  test("未報告部員名リストが null で催促メッセージ生成ができない", () => {
    const unreportedMemberNameList = null;
    const meetingStartTime = new Date("2024-01-15T09:00:00Z");

    expect(() => {
      generateRemindMessage(unreportedMemberNameList, meetingStartTime);
    }).toThrow(/未報告部員名リスト/);
  });
});