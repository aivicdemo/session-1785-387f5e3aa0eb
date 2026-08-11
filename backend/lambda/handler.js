const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const REPORTS_TABLE = process.env.REPORTS_TABLE || 'reports';
const USERS_TABLE = process.env.USERS_TABLE || 'users';

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    const httpMethod = event.httpMethod;
    const path = event.path;
    
    try {
        if (path === '/api/reports' && httpMethod === 'POST') {
            return await handlePostReport(event);
        } else if (path === '/api/reports' && httpMethod === 'GET') {
            return await handleGetReports(event);
        } else if (path === '/api/dashboard' && httpMethod === 'GET') {
            return await handleGetDashboard(event);
        } else if (path === '/api/auth/login' && httpMethod === 'POST') {
            return await handleLogin(event);
        } else if (path === '/api/auth/logout' && httpMethod === 'POST') {
            return await handleLogout(event);
        } else {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Not found' })
            };
        }
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

async function handlePostReport(event) {
    const body = JSON.parse(event.body);
    
    const reportId = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    const report = {
        id: reportId,
        reportDate: body.reportDate,
        department: body.department,
        yesterday: body.yesterday,
        today: body.today,
        issues: body.issues,
        sender: body.sender,
        timestamp: timestamp,
        status: 'submitted'
    };
    
    await dynamodb.put({
        TableName: REPORTS_TABLE,
        Item: report
    }).promise();
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ success: true, id: reportId })
    };
}

async function handleGetReports(event) {
    const result = await dynamodb.scan({
        TableName: REPORTS_TABLE
    }).promise();
    
    const reports = result.Items.sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
    });
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(reports)
    };
}

async function handleGetDashboard(event) {
    const result = await dynamodb.scan({
        TableName: REPORTS_TABLE
    }).promise();
    
    const reports = result.Items;
    
    // 部門別集計
    const departmentStats = {};
    reports.forEach(report => {
        if (!departmentStats[report.department]) {
            departmentStats[report.department] = {
                total: 0,
                submitted: 0
            };
        }
        departmentStats[report.department].total++;
        if (report.status === 'submitted') {
            departmentStats[report.department].submitted++;
        }
    });
    
    // 提出期限（例：本日23:59）
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const deadline = today.toISOString();
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            deadline: deadline,
            departmentStats: departmentStats,
            totalReports: reports.length
        })
    };
}

async function handleLogin(event) {
    const body = JSON.parse(event.body);
    const { username, password } = body;
    
    // ユーザー認証（簡易版）
    const result = await dynamodb.get({
        TableName: USERS_TABLE,
        Key: { username: username }
    }).promise();
    
    if (!result.Item) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Invalid credentials' })
        };
    }
    
    // パスワード検証（実装簡略化）
    if (result.Item.password !== password) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Invalid credentials' })
        };
    }
    
    const token = `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            success: true,
            token: token,
            user: {
                username: result.Item.username,
                email: result.Item.email,
                department: result.Item.department,
                manager: result.Item.manager
            }
        })
    };
}

async function handleLogout(event) {
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ success: true })
    };
}