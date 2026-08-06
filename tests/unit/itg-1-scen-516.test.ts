import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sendReminderEmailsForUnreportedMembers } from '../../src/logic/it-1-br-1-1-1';

// Mock type definitions
interface MockEmailService {
  sendEmail: jest.Mock;
}

interface MockMemberData {
  memberId: string;
  name: string;
  email: string | null;
  departmentId: string;
  reportingStatus: boolean;
}

interface MockSendReminderEmailsInput {
  members: MockMemberData[];
  departmentId: string;
  meetingStartTime: Date;
}

interface MockSendReminderEmailsOutput {
  successCount: number;
  failureCount: number;
  skippedCount: number;
  failedMembers: Array<{
    memberId: string;
    name: string;
    reason: string;
  }>;
  processedMembers: Array<{
    memberId: string;
    emailSent: boolean;
  }>;
}

describe('IT-1-BR-1-1-1: 報告送信時の確認メール自動配信 - メールアドレスnull時のエラーハンドリング', () => {
  let emailServiceMock: MockEmailService;

  beforeEach(() => {
    jest.clearAllMocks();
    emailServiceMock = {
      sendEmail: jest.fn().mockResolvedValue({ success: true })
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // SCEN-516: メールアドレスがnullの部員に対するエラーハンドリング
  test('SCEN-516: メールアドレスnullの部員への催促メール送信がスキップされ、他の部員への送信は継続される', async () => {
    // Prepare test data
    const validEmailMember = {
      memberId: 'MEM-001',
      name: '田中太郎',
      email: 'tanaka@example.com',
      departmentId: 'DEPT-DEV-001',
      reportingStatus: false
    };

    const nullEmailMember = {
      memberId: 'MEM-002',
      name: '鈴木花子',
      email: null,
      departmentId: 'DEPT-DEV-001',
      reportingStatus: false
    };

    const anotherValidEmailMember = {
      memberId: 'MEM-003',
      name: '佐藤次郎',
      email: 'sato@example.com',
      departmentId: 'DEPT-DEV-001',
      reportingStatus: false
    };

    const inputData: MockSendReminderEmailsInput = {
      members: [validEmailMember, nullEmailMember, anotherValidEmailMember],
      departmentId: 'DEPT-DEV-001',
      meetingStartTime: new Date('2024-01-15T09:00:00Z')
    };

    // Execute function
    const result = await sendReminderEmailsForUnreportedMembers(inputData);

    // Verify result structure
    expect(result).toHaveProperty('successCount');
    expect(result).toHaveProperty('failureCount');
    expect(result).toHaveProperty('skippedCount');
    expect(result).toHaveProperty('failedMembers');
    expect(result).toHaveProperty('processedMembers');

    // Verify counts
    expect(result.successCount).toBe(2);
    expect(result.skippedCount).toBe(1);
    expect(result.failureCount).toBe(0);

    // Verify skipped member with null email is recorded
    expect(result.failedMembers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          memberId: 'MEM-002',
          name: '鈴木花子',
          reason: expect.stringMatching(/メール|email|null/)
        })
      ])
    );

    // Verify processed members status
    expect(result.processedMembers).toHaveLength(3);

    // Valid email members should have successful email sending
    const validMemberProcessed = result.processedMembers.find(
      m => m.memberId === 'MEM-001'
    );
    expect(validMemberProcessed?.emailSent).toBe(true);

    // Null email member should have failed email sending
    const nullMemberProcessed = result.processedMembers.find(
      m => m.memberId === 'MEM-002'
    );
    expect(nullMemberProcessed?.emailSent).toBe(false);

    // Another valid email member should have successful email sending
    const anotherValidMemberProcessed = result.processedMembers.find(
      m => m.memberId === 'MEM-003'
    );
    expect(anotherValidMemberProcessed?.emailSent).toBe(true);

    // Verify system continues processing after encountering null email
    expect(result.successCount + result.skippedCount + result.failureCount).toBe(3);
  });
});