const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const DAILY_REPORTS_TABLE = 'DailyReports';
const USERS_TABLE = 'Users';
const DEPARTMENTS_TABLE = 'Departments';

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
    // User endpoint
    if (path === '/api/user' && method === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          id: 'user123',
          name: 'Test User',
          email: 'testuser@example.com',
          department: '営業部',
          managerId: 'manager001'
        })
      };
    }
    
    // Daily reports list endpoint
    if (path === '/api/daily-reports' && method === 'GET') {
      const params = {
        TableName: DAILY_REPORTS_TABLE,
        ScanIndexForward: false,
        Limit: 100
      };
      
      const result = await dynamodb.scan(params).promise();
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.Items || [])
      };
    }
    
    // Daily report submit endpoint
    if (path === '/api/daily-reports' && method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      
      const reportId = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      const params = {
        TableName: DAILY_REPORTS_TABLE,
        Item: {
          id: reportId,
          reportDate: body.reportDate,
          department: body.department,
          yesterday: body.yesterday,
          today: body.today,
          issues: body.issues,
          submittedBy: 'user123',
          submittedAt: now,
          status: 'submitted',
          createdAt: now,
          updatedAt: now
        }
      };
      
      await dynamodb.put(params).promise();
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          id: reportId,
          message: 'Report submitted successfully'
        })
      };
    }
    
    // Dashboard endpoint
    if (path === '/api/dashboard' && method === 'GET') {
      const params = {
        TableName: DEPARTMENTS_TABLE,
        Limit: 100
      };
      
      const result = await dynamodb.scan(params).promise();
      const departments = result.Items || [];
      
      // Get submission deadline
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 1);
      deadline.setHours(18, 0, 0, 0);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          deadline: deadline.toISOString(),
          departments: departments.map(dept => ({
            name: dept.name,
            submitted: dept.submitted || 0,
            total: dept.total || 0,
            submissionRate: dept.total > 0 ? Math.round((dept.submitted / dept.total) * 100) : 0
          }))
        })
      };
    }
    
    // Manager info endpoint
    if (path.startsWith('/api/manager/') && method === 'GET') {
      const managerId = path.split('/').pop();
      
      const params = {
        TableName: USERS_TABLE,
        Key: { id: managerId }
      };
      
      const result = await dynamodb.get(params).promise();
      
      if (result.Item) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            id: result.Item.id,
            name: result.Item.name,
            email: result.Item.email
          })
        };
      }
      
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Manager not found' })
      };
    }
    
    // Default response
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