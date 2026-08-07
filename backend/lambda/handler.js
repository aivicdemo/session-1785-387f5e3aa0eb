const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const REPORTS_TABLE = process.env.REPORTS_TABLE || 'reports';
const USERS_TABLE = process.env.USERS_TABLE || 'users';

function createResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  };
}

function getCurrentUser(event) {
  // セッション/認証情報からユーザー取得
  // テスト環境では固定値を返す
  const userId = event.requestContext?.authorizer?.claims?.sub || 'testuser';
  return {
    id: userId,
    email: 'testuser@example.com',
    name: 'テストユーザー',
    manager: '部長 <bucho@example.com>'
  };
}

async function getReports(event) {
  try {
    const user = getCurrentUser(event);
    
    const params = {
      TableName: REPORTS_TABLE,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': user.id
      },
      ScanIndexForward: false // 新しい順
    };
    
    const result = await dynamodb.query(params).promise();
    
    const reports = (result.Items || []).map(item => ({
      id: item.id,
      date: item.date,
      department: item.department,
      yesterday: item.yesterday,
      today: item.today,
      issues: item.issues,
      sender: user.name,
      timestamp: new Date(item.timestamp).toLocaleString('ja-JP'),
      status: 'sent'
    }));
    
    return createResponse(200, reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return createResponse(500, { error: 'Failed to fetch reports' });
  }
}

async function createReport(event) {
  try {
    const user = getCurrentUser(event);
    const body = JSON.parse(event.body || '{}');
    
    const { date, department, yesterday, today, issues } = body;
    
    // バリデーション
    if (!date || !department || (!yesterday && !today && !issues)) {
      return createResponse(400, { error: 'Missing required fields' });
    }
    
    const reportId = `${user.id}-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    const params = {
      TableName: REPORTS_TABLE,
      Item: {
        userId: user.id,
        id: reportId,
        date,
        department,
        yesterday,
        today,
        issues,
        timestamp,
        status: 'sent'
      }
    };
    
    await dynamodb.put(params).promise();
    
    return createResponse(200, {
      id: reportId,
      message: 'Report submitted successfully'
    });
  } catch (error) {
    console.error('Error creating report:', error);
    return createResponse(500, { error: 'Failed to create report' });
  }
}

async function getUser(event) {
  try {
    const user = getCurrentUser(event);
    return createResponse(200, user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return createResponse(500, { error: 'Failed to fetch user' });
  }
}

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event));
  
  const path = event.path || event.rawPath || '';
  const method = event.httpMethod || event.requestContext?.http?.method || 'GET';
  
  // CORS preflight
  if (method === 'OPTIONS') {
    return createResponse(200, {});
  }
  
  // ルーティング
  if (path.includes('/api/reports')) {
    if (method === 'GET') {
      return await getReports(event);
    } else if (method === 'POST') {
      return await createReport(event);
    }
  } else if (path.includes('/api/user')) {
    if (method === 'GET') {
      return await getUser(event);
    }
  }
  
  return createResponse(404, { error: 'Not found' });
};