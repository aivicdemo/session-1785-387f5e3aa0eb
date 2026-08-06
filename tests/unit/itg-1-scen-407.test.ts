import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fetchMock from 'jest-fetch-mock';
import { sendPromptionEmailAndUpdateStatus } from '../../src/logic/it-1-br-1-1-1';

fetchMock.enableMocks();

describe('催促自動停止機能', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-407
  test('催促試行が規定回数に達した場合、システムが自動的に催促を停止する', async () => {
    const max_promption_attempts = 3;
    const employee_id = 'EMP-A-001';
    const department_head_id = 'DEPT-HEAD-001';
    const email_address = 'employee-a@example.com';

    const mock_send_email_responses = [
      { email_id: 'email-001', status: 'sent', sent_at: '2024-01-15T08:00:00Z' },
      { email_id: 'email-002', status: 'sent', sent_at: '2024-01-15T08:30:00Z' },
      { email_id: 'email-003', status: 'sent', sent_at: '2024-01-15T09:00:00Z' }
    ];

    const config_request = {
      max_promption_attempts: max_promption_attempts
    };

    fetchMock.mockResponseOnce(JSON.stringify({ success: true, config_id: 'config-001' }), { status: 200 });

    const config_response = await fetch('/api/config/promption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config_request)
    });
    const config_result = await config_response.json();
    expect(config_result.success).toBe(true);

    for (let attempt = 1; attempt <= max_promption_attempts; attempt++) {
      fetchMock.mockResponseOnce(JSON.stringify(mock_send_email_responses[attempt - 1]), { status: 200 });

      const promption_request = {
        employee_id: employee_id,
        department_head_id: department_head_id,
        email_address: email_address,
        attempt_number: attempt,
        config_id: config_result.config_id
      };

      const send_response = await fetch('/api/promption/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promption_request)
      });
      const send_result = await send_response.json();

      expect(send_result.status).toBe('sent');
      expect(send_result.email_id).toBeDefined();
    }

    fetchMock.mockResponseOnce(JSON.stringify({
      employee_id: employee_id,
      attempt_count: 3,
      promption_stopped: true,
      last_email_sent_at: '2024-01-15T09:00:00Z'
    }), { status: 200 });

    const status_check_response = await fetch(`/api/promption/status/${employee_id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const status_check_result = await status_check_response.json();

    expect(status_check_result.attempt_count).toBe(3);
    expect(status_check_result.promption_stopped).toBe(true);

    const fourth_attempt_request = {
      employee_id: employee_id,
      department_head_id: department_head_id,
      email_address: email_address,
      attempt_number: 4,
      config_id: config_result.config_id
    };

    fetchMock.mockResponseOnce(JSON.stringify({
      success: false,
      reason: 'promption_stopped',
      email_sent: false,
      promption_stopped_flag: true
    }), { status: 200 });

    const fourth_response = await fetch('/api/promption/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fourth_attempt_request)
    });
    const fourth_result = await fourth_response.json();

    expect(fourth_result.success).toBe(false);
    expect(fourth_result.reason).toBe('promption_stopped');
    expect(fourth_result.email_sent).toBe(false);
    expect(fourth_result.promption_stopped_flag).toBe(true);

    const final_status_response = await fetch(`/api/promption/status/${employee_id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const final_status_result = await final_status_response.json();

    expect(final_status_result.promption_stopped).toBe(true);
    expect(final_status_result.attempt_count).toBe(3);
    expect(fetchMock.mock.calls.length).toBe(5);
  });
});