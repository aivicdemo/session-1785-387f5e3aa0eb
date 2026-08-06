import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

describe('報告到着状況把握機能 - ユーザーマスタテーブルアクセスエラー処理', () => {
  // SCEN-468
  test('ユーザーマスタテーブルへのアクセスが失敗したとき、エラーになる', async () => {
    // Arrange
    const { fetchReportArrivalStatus } = await import('../../src/logic/it-1-br-1-1-1');
    
    const mockUserMasterError = new Error('Database connection failed');
    
    // Mock fetch to simulate database connection error
    const fetchMock = require('jest-fetch-mock');
    fetchMock.enableMocks();
    fetchMock.resetMocks();
    
    fetchMock.mockRejectOnce(mockUserMasterError);
    
    // Act & Assert
    try {
      await fetchReportArrivalStatus();
      // If we reach here, test should fail
      expect(true).toBe(false);
    } catch (error) {
      // Assert: Error should be caught and message should contain 'ユーザー情報'
      expect((error as Error).message).toMatch(/ユーザー情報/);
      expect((error as Error).message).toMatch(/取得に失敗/);
    }
    
    fetchMock.disableMocks();
  });
});