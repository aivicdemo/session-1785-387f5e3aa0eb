const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const REPORTS_TABLE = 'DailyReports';
const USERS_TABLE = 'Users';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event));
  
  const path = event.path || event.rawPath || '';
  const method = event.httpMethod || event.requestContext?.http?.method || 'GET';
  
  try {
    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: ''
      };
    }
    
    // Get current user
    if (path === '/api/user' && method === 'GET') {
      return handleGetUser(event);
    }
    
    // Get all reports
    if (path === '/api/reports' && method === 'GET') {
      return handleGetReports(event);
    }
    
    // Create new report
    if (path === '/api/reports' && method === 'POST') {
      return handleCreateReport(event);
    }
    
    // Get dashboard data
    if (path === '/api/dashboard' && method === 'GET') {
      return handleGetDashboard(event);
    }
    
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function handleGetUser(event) {
  // Mock user data - in production, get from auth context
  const user = {
    id: 'user123',
    name: 'テストユーザー',
    email: 'testuser@example.com',
    department: '営業部',
    manager: {
      id: 'manager1',
      name: '部長',
      email: 'bucho@example.com'
    }
  };
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(user)
  };
}

async function handleGetReports(event) {
  try {
    const params = {
      TableName: REPORTS_TABLE,
      ScanIndexForward: false,
      Limit: 100
    };
    
    const result = await dynamodb.scan(params).promise();
    
    // Sort by timestamp descending
    const reports = (result.Items || []).sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(reports)
    };
  } catch (error) {
    console.error('Error getting reports:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}

async function handleCreateReport(event) {
  try {
    const body = JSON.parse(event.body || '{}');
    
    // Validate required fields
    if (!body.date || !body.department || !body.yesterday || !body.today || !body.issues) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }
    
    const reportId = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    const report = {
      id: reportId,
      date: body.date,
      department: body.department,
      yesterday: body.yesterday,
      today: body.today,
      issues: body.issues,
      userId: body.userId || 'user123',
      userEmail: body.userEmail || 'testuser@example.com',
      managerEmail: body.managerEmail || 'bucho@example.com',
      timestamp: timestamp,
      status: 'submitted',
      createdAt: timestamp
    };
    
    const params = {
      TableName: REPORTS_TABLE,
      Item: report
    };
    
    await dynamodb.put(params).promise();
    
    // Send email notification (mock)
    console.log(`Email sent to ${report.managerEmail} about report from ${report.userEmail}`);
    
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(report)
    };
  } catch (error) {
    console.error('Error creating report:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}

async function handleGetDashboard(event) {
  try {
    // Get all reports
    const reportsParams = {
      TableName: REPORTS_TABLE
    };
    const reportsResult = await dynamodb.scan(reportsParams).promise();
    const reports = reportsResult.Items || [];
    
    // Get all users
    const usersParams = {
      TableName: USERS_TABLE
    };
    const usersResult = await dynamodb.scan(usersParams).promise();
    const users = usersResult.Items || [];
    
    // Calculate submission status by department
    const departments = {};
    
    users.forEach(user => {
      if (!departments[user.department]) {
        departments[user.department] = {
          name: user.department,
          total: 0,
          submitted: 0,
          rate: 0
        };
      }
      departments[user.department].total++;
    });
    
    // Count submitted reports
    const today = new Date().toISOString().split('T')[0];
    reports.forEach(report => {
      if (report.date === today && departments[report.department]) {
        departments[report.department].submitted++;
      }
    });
    
    // Calculate rates
    Object.values(departments).forEach(dept => {
      dept.rate = dept.total > 0 ? Math.round((dept.submitted / dept.total) * 100) : 0;
    });
    
    const dashboard = {
      submissionDeadline: new Date(new Date().setHours(18, 0, 0, 0)).toISOString(),
      departments: Object.values(departments),
      totalReports: reports.length,
      todayReports: reports.filter(r => r.date === today).length
    };
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(dashboard)
    };
  } catch (error) {
    console.error('Error getting dashboard:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}