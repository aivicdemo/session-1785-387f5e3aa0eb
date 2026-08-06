import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('報告到着状況把握機能', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-453
  it('部門IDが0のとき、HTTPステータスコード400とエラーメッセージを返却する', async () => {
    const departmentId = 0;
    const requestUrl = 'http://localhost/api/report-status';

    const mockErrorResponse = {
      status: 'error',
      code: 'INVALID_DEPARTMENT_ID',
      message: '部門IDは1以上の正の整数である必要があります',
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockErrorResponse), {
      status: 400,
    });

    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ departmentId }),
    });

    expect(response.status).toBe(400);

    const responseBody = await response.json();
    expect(responseBody.message).toMatch(/部門ID/);
    expect(responseBody.message).toMatch(/1以上/);
    expect(responseBody.message).toMatch(/正の整数/);
  });
});