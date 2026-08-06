import { runTx3Imp1Agent } from '../../src/logic/it-1';

const mockFetch = jest.fn();
global.fetch = mockFetch;

interface MockAiClientInput {
  confirmationEmailContent: string;
}

interface MockAiClientOutput {
  unreportedMembers: Array<{
    memberId: string;
    memberName: string;
    reportStatus: 'unreported' | 'delayed';
  }>;
  urgencyScore: number;
}

interface SendHistoryRecord {
  memberId: string;
  memberName: string;
  sendAttempt: number;
  timestamp: string;
  status: string;
}

interface SkipLogRecord {
  memberId: string;
  memberName: string;
  reason: string;
  timestamp: string;
}

interface MailSendLog {
  recipientId: string;
  timestamp: string;
  status: string;
}

interface ChatSendLog {
  recipientId: string;
  timestamp: string;
  status: string;
}

describe('tx3-imp1-agent-idempotent-retry', () => {
  // SCEN-566
  test('should prevent duplicate promotional message sending on idempotent retry of unreported member identification and notification automation', async () => {
    const testDb = {
      sendHistory: [] as SendHistoryRecord[],
      skipLog: [] as SkipLogRecord[],
      mailSendLog: [] as MailSendLog[],
      chatSendLog: [] as ChatSendLog[],
    };

    const mockAiClient = {
      identifyUnreportedMembers: async (
        input: MockAiClientInput,
      ): Promise<MockAiClientOutput> => {
        return {
          unreportedMembers: [
            {
              memberId: 'member-001',
              memberName: 'Engineer A',
              reportStatus: 'unreported' as const,
            },
            {
              memberId: 'member-002',
              memberName: 'Engineer B',
              reportStatus: 'unreported' as const,
            },
            {
              memberId: 'member-003',
              memberName: 'Engineer C',
              reportStatus: 'delayed' as const,
            },
          ],
          urgencyScore: 0.95,
        };
      },
    };

    const mockMailSystem = {
      sendPromotionalEmail: async (
        recipientId: string,
        recipientName: string,
      ): Promise<void> => {
        testDb.mailSendLog.push({
          recipientId,
          timestamp: '2024-01-15T08:30:00Z',
          status: 'sent',
        });
      },
    };

    const mockChatSystem = {
      sendPromotionalMessage: async (
        recipientId: string,
        recipientName: string,
      ): Promise<void> => {
        testDb.chatSendLog.push({
          recipientId,
          timestamp: '2024-01-15T08:30:00Z',
          status: 'sent',
        });
      },
    };

    const recordSendHistory = (
      memberId: string,
      memberName: string,
      attempt: number,
    ): void => {
      testDb.sendHistory.push({
        memberId,
        memberName,
        sendAttempt: attempt,
        timestamp: '2024-01-15T08:30:00Z',
        status: 'completed',
      });
    };

    const recordSkipLog = (
      memberId: string,
      memberName: string,
      reason: string,
    ): void => {
      testDb.skipLog.push({
        memberId,
        memberName,
        reason,
        timestamp: '2024-01-15T08:35:00Z',
      });
    };

    const getLastSendAttempt = (memberId: string): number => {
      const records = testDb.sendHistory.filter(
        (r) => r.memberId === memberId,
      );
      return records.length > 0
        ? records[records.length - 1].sendAttempt
        : 0;
    };

    const confirmationEmailContent =
      'Engineer A and B have not reported. Engineer C reported late.';

    // FIRST EXECUTION
    const unreportedMembersFirstRun =
      await mockAiClient.identifyUnreportedMembers({
        confirmationEmailContent,
      });

    for (const member of unreportedMembersFirstRun.unreportedMembers) {
      const lastAttempt = getLastSendAttempt(member.memberId);
      const nextAttempt = lastAttempt + 1;

      if (nextAttempt === 1) {
        await mockMailSystem.sendPromotionalEmail(
          member.memberId,
          member.memberName,
        );
        await mockChatSystem.sendPromotionalMessage(
          member.memberId,
          member.memberName,
        );
        recordSendHistory(member.memberId, member.memberName, nextAttempt);
      }
    }

    const firstRunMailCount = testDb.mailSendLog.length;
    const firstRunChatCount = testDb.chatSendLog.length;
    const firstRunSendHistoryCount = testDb.sendHistory.length;

    expect(firstRunMailCount).toBe(3);
    expect(firstRunChatCount).toBe(3);
    expect(firstRunSendHistoryCount).toBe(3);

    expect(testDb.sendHistory).toContainEqual(
      expect.objectContaining({
        memberId: 'member-001',
        memberName: 'Engineer A',
        sendAttempt: 1,
      }),
    );
    expect(testDb.sendHistory).toContainEqual(
      expect.objectContaining({
        memberId: 'member-002',
        memberName: 'Engineer B',
        sendAttempt: 1,
      }),
    );
    expect(testDb.sendHistory).toContainEqual(
      expect.objectContaining({
        memberId: 'member-003',
        memberName: 'Engineer C',
        sendAttempt: 1,
      }),
    );

    // SECOND EXECUTION WITH SAME INPUT
    const unreportedMembersSecondRun =
      await mockAiClient.identifyUnreportedMembers({
        confirmationEmailContent,
      });

    for (const member of unreportedMembersSecondRun.unreportedMembers) {
      const lastAttempt = getLastSendAttempt(member.memberId);
      const nextAttempt = lastAttempt + 1;

      if (nextAttempt > 1) {
        recordSkipLog(
          member.memberId,
          member.memberName,
          `Promotional message already sent in attempt ${lastAttempt}`,
        );
      } else {
        await mockMailSystem.sendPromotionalEmail(
          member.memberId,
          member.memberName,
        );
        await mockChatSystem.sendPromotionalMessage(
          member.memberId,
          member.memberName,
        );
        recordSendHistory(member.memberId, member.memberName, nextAttempt);
      }
    }

    const secondRunMailCount = testDb.mailSendLog.length;
    const secondRunChatCount = testDb.chatSendLog.length;
    const secondRunSendHistoryCount = testDb.sendHistory.length;

    expect(secondRunMailCount).toBe(3);
    expect(secondRunChatCount).toBe(3);
    expect(secondRunSendHistoryCount).toBe(3);

    expect(testDb.skipLog).toHaveLength(3);
    expect(testDb.skipLog).toContainEqual(
      expect.objectContaining({
        memberId: 'member-001',
        memberName: 'Engineer A',
        reason: 'Promotional message already sent in attempt 1',
      }),
    );
    expect(testDb.skipLog).toContainEqual(
      expect.objectContaining({
        memberId: 'member-002',
        memberName: 'Engineer B',
        reason: 'Promotional message already sent in attempt 1',
      }),
    );
    expect(testDb.skipLog).toContainEqual(
      expect.objectContaining({
        memberId: 'member-003',
        memberName: 'Engineer C',
        reason: 'Promotional message already sent in attempt 1',
      }),
    );

    const mailSendCountForMember001 = testDb.mailSendLog.filter(
      (log) => log.recipientId === 'member-001',
    ).length;
    const chatSendCountForMember001 = testDb.chatSendLog.filter(
      (log) => log.recipientId === 'member-001',
    ).length;
    const mailSendCountForMember002 = testDb.mailSendLog.filter(
      (log) => log.recipientId === 'member-002',
    ).length;
    const chatSendCountForMember002 = testDb.chatSendLog.filter(
      (log) => log.recipientId === 'member-002',
    ).length;
    const mailSendCountForMember003 = testDb.mailSendLog.filter(
      (log) => log.recipientId === 'member-003',
    ).length;
    const chatSendCountForMember003 = testDb.chatSendLog.filter(
      (log) => log.recipientId === 'member-003',
    ).length;

    expect(mailSendCountForMember001).toBe(1);
    expect(chatSendCountForMember001).toBe(1);
    expect(mailSendCountForMember002).toBe(1);
    expect(chatSendCountForMember002).toBe(1);
    expect(mailSendCountForMember003).toBe(1);
    expect(chatSendCountForMember003).toBe(1);
  });
});