const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const REPORTS_TABLE = process.env.REPORTS_TABLE || 'reports';
const USERS_TABLE = process.env.USERS_TABLE || 'users';

const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
};

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event));
    
    const method = event.httpMethod;
    const path = event.path || event.rawPath || '';
    
    try {
        // OPTIONS request
        if (method === 'OPTIONS') {
            return {
                statusCode: 200,
                headers,
                body: ''
            };
        }
        
        // GET /api/reports - Get user's reports
        if (method === 'GET' && path.includes('/api/reports')) {
            const userId = event.queryStringParameters?.userId;
            
            if (!userId) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'userId required' })
                };
            }
            
            const params = {
                TableName: REPORTS_TABLE,
                KeyConditionExpression: 'userId = :userId',
                ExpressionAttributeValues: {
                    ':userId': userId
                },
                ScanIndexForward: false
            };
            
            const result = await dynamodb.query(params).promise();
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result.Items || [])
            };
        }
        
        // POST /api/reports - Create new report
        if (method === 'POST' && path.includes('/api/reports') && !path.includes('/draft')) {
            const body = JSON.parse(event.body || '{}');
            const { userId, userEmail, date, department, yesterday, today, issues, managerId, managerEmail } = body;
            
            if (!userId || !date || !department || !yesterday || !today || !issues) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Missing required fields' })
                };
            }
            
            const reportId = `${userId}#${Date.now()}`;
            const now = new Date().toISOString();
            
            const params = {
                TableName: REPORTS_TABLE,
                Item: {
                    userId,
                    reportId,
                    date,
                    department,
                    yesterday,
                    today,
                    issues,
                    userEmail,
                    managerId,
                    managerEmail,
                    status: 'sent',
                    sentAt: now,
                    createdAt: now
                }
            };
            
            await dynamodb.put(params).promise();
            
            // Send email notification (mock)
            console.log(`Email sent to ${managerEmail} from ${userEmail}`);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, reportId })
            };
        }
        
        // POST /api/reports/draft - Save draft
        if (method === 'POST' && path.includes('/api/reports/draft')) {
            const body = JSON.parse(event.body || '{}');
            const { userId, date, department, yesterday, today, issues } = body;
            
            if (!userId) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'userId required' })
                };
            }
            
            const params = {
                TableName: REPORTS_TABLE,
                Item: {
                    userId,
                    reportId: `${userId}#draft`,
                    date,
                    department,
                    yesterday,
                    today,
                    issues,
                    status: 'draft',
                    updatedAt: new Date().toISOString()
                }
            };
            
            await dynamodb.put(params).promise();
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true })
            };
        }
        
        // GET /api/users - Get all users
        if (method === 'GET' && path.includes('/api/users')) {
            const params = {
                TableName: USERS_TABLE
            };
            
            const result = await dynamodb.scan(params).promise();
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result.Items || [])
            };
        }
        
        // GET /api/dashboard - Get dashboard data
        if (method === 'GET' && path.includes('/api/dashboard')) {
            const params = {
                TableName: REPORTS_TABLE
            };
            
            const result = await dynamodb.scan(params).promise();
            const reports = result.Items || [];
            
            // Get all users
            const usersParams = {
                TableName: USERS_TABLE
            };
            const usersResult = await dynamodb.scan(usersParams).promise();
            const users = usersResult.Items || [];
            
            // Group by department
            const departmentStats = {};
            users.forEach(user => {
                const dept = user.department || 'Unknown';
                if (!departmentStats[dept]) {
                    departmentStats[dept] = { total: 0, submitted: 0 };
                }
                departmentStats[dept].total++;
                
                const userReports = reports.filter(r => r.userId === user.id && r.status === 'sent');
                if (userReports.length > 0) {
                    departmentStats[dept].submitted++;
                }
            });
            
            const deadline = new Date();
            deadline.setDate(deadline.getDate() + 1);
            deadline.setHours(17, 0, 0, 0);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    deadline: deadline.toISOString(),
                    departmentStats
                })
            };
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