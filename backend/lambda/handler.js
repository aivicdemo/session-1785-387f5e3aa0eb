const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const REPORTS_TABLE = 'reports';
const USERS_TABLE = 'users';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

function response(statusCode, body) {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body)
  };
}

function errorResponse(statusCode, message) {
  return response(statusCode, { error: message });
}

async function handleGetUser(event) {
  try {
    const userId = event.requestContext?.authorizer?.claims?.sub || 'testuser';
    const params = {
      TableName: USERS_TABLE,
      Key: { userId }
    };
    
    const result = await dynamodb.get(params).promise();
    if (result.Item) {
      return response(200, result.Item);
    }
    
    // Return default test user
    return response(200, {
      userId: 'testuser',
      email: 'testuser@example.com',
      name: 'Test User',
      department: '営業部',
      managerId: 'manager1'
    });
  } catch (error) {
    console.error('Error getting user:', error);
    return errorResponse(500, 'Failed to get user');
  }
}

async function handleGetReportHistory(event) {
  try {
    const userId = event.requestContext?.authorizer?.claims?.sub || 'testuser';
    
    const params = {
      TableName: REPORTS_TABLE,
      IndexName: 'userIdIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false,
      Limit: 100
    };
    
    const result = await dynamodb.query(params).promise();
    const reports = result.Items || [];
    
    return response(200, reports);
  } catch (error) {
    console.error('Error getting report history:', error);
    return errorResponse(500, 'Failed to get report history');
  }
}

async function handleSubmitReport(event) {
  try {
    const userId = event.requestContext?.authorizer?.claims?.sub || 'testuser';
    const body = JSON.parse(event.body);
    
    const { reportDate, department, yesterday, today, issues } = body;
    
    if (!reportDate || !department || !yesterday || !today || !issues) {
      return errorResponse(400, 'Missing required fields');
    }
    
    const reportId = `${userId}-${Date.now()}`;
    const now = new Date().toISOString();
    
    const params = {
      TableName: REPORTS_TABLE,
      Item: {
        reportId,
        userId,
        reportDate,
        department,
        yesterday,
        today,
        issues,
        status: 'sent',
        sentAt: now,
        createdAt: now
      }
    };
    
    await dynamodb.put(params).promise();
    
    // TODO: Send email to manager
    // const user = await getUser(userId);
    // const manager = await getUser(user.managerId);
    // await sendEmail(manager.email, ...);
    
    return response(200, {
      success: true,
      reportId,
      message: 'Report submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting report:', error);
    return errorResponse(500, 'Failed to submit report');
  }
}

async function handleSaveDraft(event) {
  try {
    const userId = event.requestContext?.authorizer?.claims?.sub || 'testuser';
    const body = JSON.parse(event.body);
    
    const { yesterday, today, issues } = body;
    
    const draftId = `${userId}-draft`;
    const now = new Date().toISOString();
    
    const params = {
      TableName: REPORTS_TABLE,
      Item: {
        reportId: draftId,
        userId,
        yesterday,
        today,
        issues,
        status: 'draft',
        updatedAt: now
      }
    };
    
    await dynamodb.put(params).promise();
    
    return response(200, {
      success: true,
      message: 'Draft saved successfully'
    });
  } catch (error) {
    console.error('Error saving draft:', error);
    return errorResponse(500, 'Failed to save draft');
  }
}

async function handleGetDashboard(event) {
  try {
    const params = {
      TableName: REPORTS_TABLE,
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'sent'
      }
    };
    
    const result = await dynamodb.scan(params).promise();
    const reports = result.Items || [];
    
    // Group by department
    const departmentStats = {};
    reports.forEach(report => {
      if (!departmentStats[report.department]) {
        departmentStats[report.department] = {
          department: report.department,
          submitted: 0,
          total: 0
        };
      }
      departmentStats[report.department].submitted += 1;
    });
    
    // Get total users per department (from mock data)
    const departments = ['営業部', '企画部', '技術部', '管理部'];
    departments.forEach(dept => {
      if (!departmentStats[dept]) {
        departmentStats[dept] = {
          department: dept,
          submitted: 0,
          total: 0
        };
      }
      // Mock: assume 5 users per department
      departmentStats[dept].total = 5;
    });
    
    const stats = Object.values(departmentStats);
    
    return response(200, {
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      departmentStats: stats
    });
  } catch (error) {
    console.error('Error getting dashboard:', error);
    return errorResponse(500, 'Failed to get dashboard');
  }
}

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event));
  
  const path = event.path || event.rawPath || '';
  const method = event.httpMethod || event.requestContext?.http?.method || 'GET';
  
  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }
  
  // Route handlers
  if (path === '/api/user' && method === 'GET') {
    return handleGetUser(event);
  }
  
  if (path === '/api/reports/history' && method === 'GET') {
    return handleGetReportHistory(event);
  }
  
  if (path === '/api/reports/submit' && method === 'POST') {
    return handleSubmitReport(event);
  }
  
  if (path === '/api/reports/draft' && method === 'POST') {
    return handleSaveDraft(event);
  }
  
  if (path === '/api/dashboard' && method === 'GET') {
    return handleGetDashboard(event);
  }
  
  return errorResponse(404, 'Not found');
};