const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const USERS_TABLE = 'users';
const DAILY_REPORTS_TABLE = 'daily_reports';
const DEPARTMENTS_TABLE = 'departments';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event));
  
  const path = event.path || event.rawPath || '';
  const method = event.httpMethod || event.requestContext?.http?.method || '';
  
  try {
    // Get current user from authorization header or session
    const currentUser = await getCurrentUser(event);
    
    if (!currentUser && !path.includes('/login')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }
    
    // Routes
    if (path.includes('/api/user') && method === 'GET') {
      return await handleGetUser(currentUser);
    }
    
    if (path.includes('/api/daily-reports') && method === 'GET') {
      return await handleGetDailyReports(currentUser);
    }
    
    if (path.includes('/api/daily-reports') && method === 'POST') {
      return await handlePostDailyReport(currentUser, event);
    }
    
    if (path.includes('/api/dashboard') && method === 'GET') {
      return await handleGetDashboard(currentUser);
    }
    
    if (path.includes('/login') && method === 'POST') {
      return await handleLogin(event);
    }
    
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not Found' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal Server Error', message: error.message })
    };
  }
};

async function getCurrentUser(event) {
  // In a real scenario, this would validate JWT or session tokens
  // For testing, we'll use a mock user from headers or default
  const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
  
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // In production, validate JWT here
    // For now, return mock user
    return {
      userId: 'user123',
      email: 'testuser@example.com',
      name: 'Test User',
      department: '営業部'
    };
  }
  
  // Default mock user for testing
  return {
    userId: 'user123',
    email: 'testuser@example.com',
    name: 'Test User',
    department: '営業部'
  };
}

async function handleGetUser(currentUser) {
  try {
    // Get department head info
    const departmentHeadParams = {
      TableName: USERS_TABLE,
      IndexName: 'departmentIndex',
      KeyConditionExpression: 'department = :dept AND isHead = :isHead',
      ExpressionAttributeValues: {
        ':dept': currentUser.department,
        ':isHead': true
      }
    };
    
    const headResult = await dynamodb.query(departmentHeadParams).promise();
    const departmentHead = headResult.Items?.[0] || {
      name: '部長',
      email: 'bucho@example.com'
    };
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        user: currentUser,
        departmentHead: departmentHead
      })
    };
  } catch (error) {
    console.error('Error getting user:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get user info' })
    };
  }
}

async function handleGetDailyReports(currentUser) {
  try {
    const params = {
      TableName: DAILY_REPORTS_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': currentUser.userId
      },
      ScanIndexForward: false, // Sort by timestamp descending
      Limit: 100
    };
    
    const result = await dynamodb.query(params).promise();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        reports: result.Items || []
      })
    };
  } catch (error) {
    console.error('Error getting daily reports:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get daily reports' })
    };
  }
}

async function handlePostDailyReport(currentUser, event) {
  try {
    const body = JSON.parse(event.body || '{}');
    
    // Validate input
    if (!body.reportDate || !body.department || !body.yesterday || !body.today || !body.issues) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }
    
    const reportId = `${currentUser.userId}#${Date.now()}`;
    const now = new Date().toISOString();
    
    const params = {
      TableName: DAILY_REPORTS_TABLE,
      Item: {
        userId: currentUser.userId,
        reportId: reportId,
        reportDate: body.reportDate,
        department: body.department,
        yesterday: body.yesterday,
        today: body.today,
        issues: body.issues,
        status: 'sent',
        sentAt: now,
        createdAt: now,
        userEmail: currentUser.email,
        userName: currentUser.name
      }
    };
    
    await dynamodb.put(params).promise();
    
    // In a real scenario, send email here
    console.log('Daily report submitted:', params.Item);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        reportId: reportId,
        message: 'Daily report submitted successfully'
      })
    };
  } catch (error) {
    console.error('Error posting daily report:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to submit daily report' })
    };
  }
}

async function handleGetDashboard(currentUser) {
  try {
    // Get all users in the department
    const usersParams = {
      TableName: USERS_TABLE,
      IndexName: 'departmentIndex',
      KeyConditionExpression: 'department = :dept',
      ExpressionAttributeValues: {
        ':dept': currentUser.department
      }
    };
    
    const usersResult = await dynamodb.query(usersParams).promise();
    const users = usersResult.Items || [];
    const totalUsers = users.length;
    
    // Get submitted reports for today
    const today = new Date().toISOString().split('T')[0];
    const reportsParams = {
      TableName: DAILY_REPORTS_TABLE,
      IndexName: 'departmentDateIndex',
      KeyConditionExpression: 'department = :dept AND reportDate = :date',
      ExpressionAttributeValues: {
        ':dept': currentUser.department,
        ':date': today
      }
    };
    
    const reportsResult = await dynamodb.query(reportsParams).promise();
    const submittedReports = reportsResult.Items || [];
    const submittedCount = new Set(submittedReports.map(r => r.userId)).size;
    
    // Calculate submission deadline (e.g., 18:00 today)
    const deadline = new Date();
    deadline.setHours(18, 0, 0, 0);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        deadline: deadline.toISOString(),
        departmentSummary: {
          department: currentUser.department,
          totalUsers: totalUsers,
          submittedCount: submittedCount,
          submissionRate: totalUsers > 0 ? Math.round((submittedCount / totalUsers) * 100) : 0
        }
      })
    };
  } catch (error) {
    console.error('Error getting dashboard:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get dashboard data' })
    };
  }
}

async function handleLogin(event) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, password } = body;
    
    // In a real scenario, validate credentials against database
    // For testing, accept any email/password
    if (!email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email and password required' })
      };
    }
    
    // Create mock JWT token
    const token = Buffer.from(JSON.stringify({
      email: email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400
    })).toString('base64');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        token: token,
        user: {
          email: email,
          name: 'Test User'
        }
      })
    };
  } catch (error) {
    console.error('Error logging in:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Login failed' })
    };
  }
}