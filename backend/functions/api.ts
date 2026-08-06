import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  DynamoDBClient,
  BatchWriteItemCommand,
  BatchWriteItemCommandInput,
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { extractAuthContext, requirePermission, AuthContext } from './rbac';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.MAIN_TABLE || 'morning-report-system';

interface AuditLog {
  pk: string;
  sk: string;
  action: string;
  userId: string;
  role: string;
  timestamp: number;
  details: Record<string, unknown>;
}

interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  passwordHash: string;
  role: string;
  department?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

interface Department {
  id: string;
  name: string;
  code: string;
  parentDepartmentId?: string;
  description?: string;
  displayOrder?: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  updatedBy: string;
}

interface Report {
  id: string;
  reportDate: number;
  departmentId: string;
  reporterId: string;
  content: string;
  status: string;
  issues?: string;
  actionPlan?: string;
  createdAt: number;
  updatedAt: number;
}

interface SubmissionHistory {
  id: string;
  reportId: string;
  userId: string;
  sentAt: number;
  status: string;
  errorMessage?: string;
  createdAt: number;
  updatedAt: number;
}

interface EmailLog {
  id: string;
  reportId: string;
  submissionHistoryId?: string;
  toEmail: string;
  fromEmail: string;
  subject: string;
  status: string;
  sentAt: number;
  errorMessage?: string;
  retryCount: number;
  createdAt: number;
  updatedAt: number;
}

type Entity = User | Department | Report | SubmissionHistory | EmailLog;

const TABLE_CONFIGS: Record<string, { pk: string; sk?: string }> = {
  '0': { pk: 'USER', sk: 'id' },
  '1': { pk: 'DEPARTMENT', sk: 'id' },
  '2': { pk: 'REPORT', sk: 'id' },
  '3': { pk: 'SUBMISSION_HISTORY', sk: 'id' },
  '4': { pk: 'EMAIL_LOG', sk: 'id' },
};

async function createAuditLog(
  auth: AuthContext,
  action: string,
  details: Record<string, unknown>
): Promise<void> {
  const auditLog: AuditLog = {
    pk: 'AUDIT',
    sk: `${Date.now()}#${randomUUID()}`,
    action,
    userId: auth.userId,
    role: auth.role,
    timestamp: Date.now(),
    details,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: auditLog,
    })
  );
}

function createResponse(
  statusCode: number,
  body: Record<string, unknown> | string
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  };
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

async function getResources(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuthContext(event);
    requirePermission(auth, 'users:read');

    const resources = {
      users: [],
      departments: [],
      reports: [],
      submissionHistories: [],
      emailLogs: [],
    };

    const userResult = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'pk = :pk',
        ExpressionAttributeValues: { ':pk': 'USER' },
      })
    );
    resources.users = userResult.Items || [];

    const deptResult = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'pk = :pk',
        ExpressionAttributeValues: { ':pk': 'DEPARTMENT' },
      })
    );
    resources.departments = deptResult.Items || [];

    const reportResult = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'pk = :pk',
        ExpressionAttributeValues: { ':pk': 'REPORT' },
      })
    );
    resources.reports = reportResult.Items || [];

    const submissionResult = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'pk = :pk',
        ExpressionAttributeValues: { ':pk': 'SUBMISSION_HISTORY' },
      })
    );
    resources.submissionHistories = submissionResult.Items || [];

    const emailResult = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'pk = :pk',
        ExpressionAttributeValues: { ':pk': 'EMAIL_LOG' },
      })
    );
    resources.emailLogs = emailResult.Items || [];

    await createAuditLog(auth, 'GET_RESOURCES', { resourceCount: 5 });

    return createResponse(200, resources);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Forbidden')) {
      return createResponse(403, { error: message });
    }
    if (message.includes('Missing Authorization') || message.includes('Invalid')) {
      return createResponse(401, { error: message });
    }
    return createResponse(500, { error: message });
  }
}

async function bulkImport(
  event: APIGatewayProxyEvent,
  tableIndex: string
): Promise<APIGatewayProxyResult> {
  try {
    const auth = extractAuthContext(event);
    requirePermission(auth, 'bulk:import');

    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const { items } = JSON.parse(event.body) as { items: Record<string, unknown>[] };

    if (!Array.isArray(items) || items.length === 0) {
      return createResponse(400, { error: 'items must be a non-empty array' });
    }

    const config = TABLE_CONFIGS[tableIndex];
    if (!config) {
      return createResponse(400, { error: 'Invalid table index' });
    }

    const now = Date.now();
    const enrichedItems = items.map((item) => ({
      ...item,
      pk: config.pk,
      sk: item.id || randomUUID(),
      id: item.id || randomUUID(),
      createdAt: now,
      updatedAt: now,
    }));

    const chunks: Record<string, unknown>[][] = [];
    for (let i = 0; i < enrichedItems.length; i += 25) {
      chunks.push(enrichedItems.slice(i, i + 25));
    }

    let imported = 0;
    const errors: string[] = [];

    for (const chunk of chunks) {
      const writeRequests = chunk.map((item) => ({
        PutRequest: {
          Item: {
            pk: { S: item.pk as string },
            sk: { S: item.sk as string },
            ...Object.entries(item).reduce(
              (acc, [key, value]) => {
                if (key === 'pk' || key === 'sk') return acc;
                if (typeof value === 'string') {
                  acc[key] = { S: value };
                } else if (typeof value === 'number') {
                  acc[key] = { N: value.toString() };
                } else if (typeof value === 'boolean') {
                  acc[key] = { BOOL: value };
                } else if (value === null) {
                  acc[key] = { NULL: true };
                } else {
                  acc[key] = { S: JSON.stringify(value) };
                }
                return acc;
              },
              {} as Record<string, unknown>
            ),
          },
        },
      }));

      const params: BatchWriteItemCommandInput = {
        RequestItems: {
          [TABLE_NAME]: writeRequests,
        },
      };

      try {
        const result = await client.send(new BatchWriteItemCommand(params));
        imported += chunk.length - (result.UnprocessedItems?.[TABLE_NAME]?.length || 0);

        if (result.UnprocessedItems?.[TABLE_NAME]) {
          errors.push(
            `${result.UnprocessedItems[TABLE_NAME].length} items failed to write`
          );
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(errorMsg);
      }
    }

    await createAuditLog(auth, 'BULK_IMPORT', {
      tableIndex,
      imported,
      failed: items.length - imported,
      tableName: config.pk,
    });

    return createResponse(200, {
      imported,
      failed: items.length - imported,
      errors,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Forbidden')) {
      return createResponse(403, { error: message });
    }
    if (message.includes('Missing Authorization') || message.includes('Invalid')) {
      return createResponse(401, { error: message });
    }
    return createResponse(500, { error: message });
  }
}

async function createUser(
  event: APIGatewayProxyEvent,
  auth: AuthContext
): Promise<APIGatewayProxyResult> {
  try {
    requirePermission(auth, 'users:create');

    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const userData = JSON.parse(event.body) as Partial<User>;

    if (!userData.username || !userData.displayName || !userData.email) {
      return createResponse(400, {
        error: 'username, displayName, and email are required',
      });
    }

    if (!validateEmail(userData.email)) {
      return createResponse(400, { error: 'Invalid email format' });
    }

    const user: User = {
      id: randomUUID(),
      username: userData.username,
      displayName: userData.displayName,
      email: userData.email,
      passwordHash: userData.passwordHash || '',
      role: userData.role || 'viewer',
      department: userData.department,
      isActive: userData.isActive !== false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          pk: 'USER',
          sk: user.id,
          ...user,
        },
      })
    );

    await createAuditLog(auth, 'CREATE_USER', { userId: user.id });

    return createResponse(201, user);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Forbidden')) {
      return createResponse(403, { error: message });
    }
    return createResponse(500, { error: message });
  }
}

async function getUser(
  event: APIGatewayProxyEvent,
  auth: AuthContext
): Promise<APIGatewayProxyResult> {
  try {
    requirePermission(auth, 'users:read');

    const userId = event.pathParameters?.id;
    if (!userId || !validateUUID(userId)) {
      return createResponse(400, { error: 'Invalid user ID' });
    }

    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { pk: 'USER', sk: userId },
      })
    );

    if (!result.Item) {
      return createResponse(404, { error: 'User not found' });
    }

    await createAuditLog(auth, 'GET_USER', { userId });

    return createResponse(200, result.Item);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Forbidden')) {
      return createResponse(403, { error: message });
    }
    return createResponse(500, { error: message });
  }
}

async function updateUser(
  event: APIGatewayProxyEvent,
  auth: AuthContext
): Promise<APIGatewayProxyResult> {
  try {
    requirePermission(auth, 'users:update');

    const userId = event.pathParameters?.id;
    if (!userId || !validateUUID(userId)) {
      return createResponse(400, { error: 'Invalid user ID' });
    }

    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const updateData = JSON.parse(event.body) as Partial<User>;

    if (updateData.email && !validateEmail(updateData.email)) {
      return createResponse(400, { error: 'Invalid email format' });
    }

    const updateExpression = Object.keys(updateData)
      .map((key, index) => `${key} = :val${index}`)
      .join(', ');

    const expressionAttributeValues = Object.entries(updateData).reduce(
      (acc, [key, value], index) => {
        acc[`:val${index}`] = value;
        return acc;
      },
      { ':updatedAt': Date.now() } as Record<string, unknown>
    );

    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { pk: 'USER', sk: userId },
        UpdateExpression: `SET ${updateExpression}, updatedAt = :updatedAt`,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );

    await createAuditLog(auth, 'UPDATE_USER', { userId, updates: updateData });

    return createResponse(200, { message: 'User updated successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Forbidden')) {
      return createResponse(403, { error: message });
    }
    return createResponse(500, { error: message });
  }
}

async function deleteUser(
  event: APIGatewayProxyEvent,
  auth: AuthContext
): Promise<APIGatewayProxyResult> {
  try {
    requirePermission(auth, 'users:delete');

    const userId = event.pathParameters?.id;
    if (!userId || !validateUUID(userId)) {
      return createResponse(400, { error: 'Invalid user ID' });
    }

    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { pk: 'USER', sk: userId },
      })
    );

    await createAuditLog(auth, 'DELETE_USER', { userId });

    return createResponse(200, { message: 'User deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Forbidden')) {
      return createResponse(403, { error: message });
    }
    return createResponse(500, { error: message });
  }
}

async function createDepartment(
  event: APIGatewayProxyEvent,
  auth: AuthContext
): Promise<APIGatewayProxyResult> {
  try {
    requirePermission(auth, 'departments:create');

    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const deptData = JSON.parse(event.body) as Partial<Department>;

    if (!deptData.name || !deptData.code) {
      return createResponse(400, { error: 'name and code are required' });
    }

    const department: Department = {
      id: randomUUID(),
      name: deptData.name,
      code: deptData.code,
      parentDepartmentId: deptData.parentDepartmentId,
      description: deptData.description,
      displayOrder: deptData.displayOrder || 0,
      isActive: deptData.isActive !== false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: auth.userId,
      updatedBy: auth.userId,
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          pk: 'DEPARTMENT',
          sk: department.id,
          ...department,
        },
      })
    );

    await createAuditLog(auth, 'CREATE_DEPARTMENT', { departmentId: department.id });

    return createResponse(201, department);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Forbidden')) {
      return createResponse(403, { error: message });
    }
    return createResponse(500, { error: message });
  }
}

async function getDepartment(
  event: APIGatewayProxyEvent,
  auth: AuthContext
): Promise<APIGatewayProxyResult> {
  try {
    requirePermission(auth, 'departments:read');

    const deptId = event.pathParameters?.id;
    if (!deptId || !validateUUID(deptId)) {
      return createResponse(400, { error: 'Invalid department ID' });
    }

    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { pk: 'DEPARTMENT', sk: deptId },
      })
    );

    if (!result.Item) {
      return createResponse(404, { error: 'Department not found' });
    }

    await createAuditLog(auth, 'GET_DEPARTMENT', { departmentId: deptId });

    return createResponse(200, result.Item);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Forbidden')) {
      return createResponse(403, { error: message });
    }
    return createResponse(500, { error: message });
  }
}

async function updateDepartment(
  event: APIGatewayProxyEvent,
  auth: AuthContext
): Promise<APIGatewayProxyResult> {
  try {
    requirePermission(auth, 'departments:update');

    const deptId = event.pathParameters?.id;
    if (!deptId || !validateUUID(deptId)) {
      return createResponse(400, { error: 'Invalid department ID' });
    }

    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const updateData = JSON.parse(event.body) as Partial<Department>;

    const updateExpression = Object.keys(updateData)
      .map((key, index) => `${key} = :val${index}`)
      .join(', ');

    const expressionAttributeValues = Object.entries(updateData).reduce(
      (acc, [key, value], index) => {
        acc[`:val${index}`] = value;
        return acc;
      },
      {
        ':updatedAt': Date.now(),
        ':updatedBy': auth.userId,
      } as Record<string, unknown>
    );

    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { pk: 'DEPARTMENT', sk: deptId },
        UpdateExpression: `SET ${updateExpression}, updatedAt = :updatedAt, updatedBy = :updatedBy`,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );

    await createAuditLog(auth, 'UPDATE_DEPARTMENT', {
      departmentId: deptId,
      updates: updateData,
    });

    return createResponse(200, { message: 'Department updated successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Forbidden')) {
      return createResponse(403, { error: message });
    }
    return createResponse(500, { error: message });
  }
}

async function deleteDepartment(
  event: APIGatewayProxyEvent,
  auth: AuthContext
): Promise<APIGatewayProxyResult> {
  try {
    requirePermission(auth, 'departments:delete');

    const deptId = event.pathParameters?.id;
    if (!deptId || !validateUUID(deptId)) {
      return createResponse(400, { error: 'Invalid department ID' });
    }

    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { pk: 'DEPARTMENT', sk: deptId },
      })
    );

    await createAuditLog(auth, 'DELETE_DEPARTMENT', { departmentId: deptId });

    return createResponse(200, { message: 'Department deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Forbidden')) {
      return createResponse(403, { error: message });
    }
    return createResponse(500, { error: message });
  }
}

async function createReport(
  event: APIGatewayProxyEvent,
  auth: AuthContext
): Promise<APIGatewayProxyResult> {
  try {
    requirePermission(auth, 'reports:create');

    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const reportData = JSON.parse(event.body) as Partial<Report>;

    if (!reportData.departmentId || !reportData.content || !reportData.status) {
      return createResponse(400, {
        error: 'departmentId, content, and status are required',
      });
    }

    if (!validateUUID(reportData.departmentId)) {
      return createResponse(400, { error: 'Invalid department ID' });
    }

    const report: Report = {
      id: randomUUID(),
      reportDate: reportData.reportDate || Date.now(),
      departmentId: reportData.departmentId,
      reporterId: reportData.reporterId || auth.userId,
      content: reportData.content,
      status: reportData.status,
      issues: reportData.issues,
      actionPlan: reportData.actionPlan,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          pk: 'REPORT',
          sk: report.id,
          ...report,
        },
      })
    );

    await createAuditLog(auth, 'CREATE_REPORT', { reportId: report.id });

    return createResponse(201, report);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Forbidden')) {
      return createResponse(403, { error: message });
    }
    return createResponse(500, { error: message });
  }
}

async function getReport(
  event: APIGatewayProxyEvent,
  auth: AuthContext
): Promise<APIGatewayProxyResult> {
  try {
    requirePermission(auth, 'reports:read');

    const reportId = event.pathParameters?.id;
    if (!reportId || !validateUUID(reportId)) {
      return createResponse(400, { error: 'Invalid report ID' });
    }

    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { pk: 'REPORT', sk: reportId },
      })
    );

    if (!result.Item) {
      return createResponse(404, { error: 'Report not found' });
    }

    await createAuditLog(auth, 'GET_REPORT', { reportId });

    return createResponse(200, result.Item);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Forbidden')) {
      return createResponse(403, { error: message });
    }
    return createResponse(500, { error: message });
  }
}

async function updateReport(
  event: APIGatewayProxyEvent,
  auth: AuthContext
): Promise<APIGatewayProxyResult> {
  try {
    requirePermission(auth, 'reports:update');

    const reportId = event.pathParameters?.id;
    if (!reportId || !validateUUID(reportId)) {
      return createResponse(400, { error: 'Invalid report ID' });
    }

    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const updateData = JSON.parse(event.body) as Partial<Report>;

    const updateExpression = Object.keys(updateData)
      .map((key, index) => `${key} = :val${index}`)
      .join(', ');

    const expressionAttributeValues = Object.entries(updateData).reduce(
      (acc, [key, value], index) => {
        acc[`:val${index}`] = value;
        return acc;
      },
      { ':updatedAt': Date.now() } as Record<string, unknown>
    );

    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { pk: 'REPORT', sk: reportId },
        UpdateExpression: `SET ${updateExpression}, updatedAt = :updatedAt`,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );

    await createAuditLog(auth, 'UPDATE_REPORT', { reportId, updates: updateData });

    return createResponse(200, { message: 'Report updated successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Forbidden')) {
      return createResponse(403, { error: message });
    }
    return createResponse(500, { error: message });
  }
}

async function deleteReport(
  event: APIGatewayProxyEvent,
  auth: AuthContext
): Promise<APIGatewayProxyResult> {
  try {
    requirePermission(auth, 'reports:delete');

    const reportId = event.pathParameters?.id;
    if (!reportId || !validateUUID(reportId)) {
      return createResponse(400, { error: 'Invalid report ID' });
    }

    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { pk: 'REPORT', sk: reportId },
      })
    );

    await createAuditLog(auth, 'DELETE_REPORT', { reportId });

    return createResponse(200, { message: 'Report deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Forbidden')) {
      return createResponse(403, { error: message });
    }
    return createResponse(500, { error: message });
  }
}

async function createSubmissionHistory(
  event: APIGatewayProxyEvent,
  auth: AuthContext
): Promise<APIGatewayProxyResult> {
  try {
    requirePermission(auth, 'submission_history:create');

    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const historyData = JSON.parse(event.body) as Partial<SubmissionHistory>;

    if (!historyData.reportId || !historyData.status) {
      return createResponse(400, { error: 'reportId and status are required' });
    }

    if (!validateUUID(historyData.reportId)) {
      return createResponse(400, { error: 'Invalid report ID' });
    }

    const history: SubmissionHistory = {
      id: randomUUID(),
      reportId: historyData.reportId,
      userId: historyData.userId || auth.userId,
      sentAt: historyData.sentAt || Date.now(),
      status: historyData.status,
      errorMessage: historyData.errorMessage,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          pk: 'SUBMISSION_HISTORY',
          sk: history.id,
          ...history,
        },
      })
    );

    await createAuditLog(auth, 'CREATE_SUBMISSION_HISTORY', {
      submissionHistoryId: history.id,
    });

    return createResponse(201, history);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Forbidden')) {
      return createResponse(403, { error: message });
    }
    return createResponse(500, { error: message });
  }
}

async function getSubmissionHistory(
  event: APIGatewayProxyEvent,
  auth: AuthContext
): Promise<APIGatewayProxyResult> {
  try {
    requirePermission(auth, 'submission_history:read');

    const historyId = event.pathParameters?.id;
    if (!historyId || !validateUUID(historyId)) {
      return createResponse(400, { error: 'Invalid submission history ID' });
    }

    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { pk: 'SUBMISSION_HISTORY', sk: historyId },
      })
    );

    if (!result.Item) {
      return createResponse(404, { error: 'Submission history not found' });
    }

    await createAuditLog(auth, 'GET_SUBMISSION_HISTORY', { submissionHistoryId: historyId });

    return createResponse(200, result.Item);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Forbidden')) {
      return createResponse(403, { error: message });
    }
    return createResponse(500, { error: message });
  }
}

async function updateSubmissionHistory(
  event: APIGatewayProxyEvent,
  auth: AuthContext
): Promise<APIGatewayProxyResult> {
  try {
    requirePermission(auth, 'submission_history:update');

    const historyId = event.pathParameters?.id;
    if (!historyId || !validateUUID(historyId)) {
      return createResponse(400, { error: 'Invalid submission history ID' });
    }

    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const updateData = JSON.parse(event.body) as Partial<SubmissionHistory>;

    const updateExpression = Object.keys(updateData)
      .map((key, index) => `${key} = :val${index}`)
      .join(', ');

    const expressionAttributeValues = Object.entries(updateData).reduce(
      (acc, [key, value], index) => {
        acc[`:val${index}`] = value;
        return acc;
      },
      { ':updatedAt': Date.now() } as Record<string, unknown>
    );

    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { pk: 'SUBMISSION_HISTORY', sk: historyId },
        UpdateExpression: `SET ${updateExpression}, updatedAt = :updatedAt`,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );

    await createAuditLog(auth, 'UPDATE_SUBMISSION_HISTORY', {
      submissionHistoryId: historyId,
      updates: updateData,
    });

    return createResponse(200, { message: 'Submission history updated successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Forbidden')) {
      return createResponse(403, { error: message });
    }
    return createResponse(500, { error: message });
  }
}

async function deleteSubmissionHistory(
  event: APIGatewayProxyEvent,
  auth: AuthContext
): Promise<APIGatewayProxyResult> {
  try {
    requirePermission(auth, 'submission_history:delete');

    const historyId = event.pathParameters?.id;
    if (!historyId || !validateUUID(historyId)) {
      return createResponse(400, { error: 'Invalid submission history ID' });
    }

    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { pk: 'SUBMISSION_HISTORY', sk: historyId },
      })
    );

    await createAuditLog(auth, 'DELETE_SUBMISSION_HISTORY', {
      submissionHistoryId: historyId,
    });

    return createResponse(200, { message: 'Submission history deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Forbidden')) {
      return createResponse(403, { error: message });
    }
    return createResponse(500, { error: message });
  }
}

async function createEmailLog(
  event: APIGatewayProxyEvent,
  auth: AuthContext
): Promise<APIGatewayProxyResult> {
  try {
    requirePermission(auth, 'email_logs:create');

    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const emailData = JSON.parse(event.body) as Partial<EmailLog>;

    if (
      !emailData.reportId ||
      !emailData.toEmail ||
      !emailData.fromEmail ||
      !emailData.subject ||
      !emailData.status
    ) {
      return createResponse(400, {
        error: 'reportId, toEmail, fromEmail, subject, and status are required',
      });
    }

    if (!validateEmail(emailData.toEmail) || !validateEmail(emailData.fromEmail)) {
      return createResponse(400, { error: 'Invalid email format' });
    }

    if (!validateUUID(emailData.reportId)) {
      return createResponse(400, { error: 'Invalid report ID' });
    }

    const emailLog: EmailLog = {
      id: randomUUID(),
      reportId: emailData.reportId,
      submissionHistoryId: emailData.submissionHistoryId,
      toEmail: emailData.toEmail,
      fromEmail: emailData.fromEmail,
      subject: emailData.subject,
      status: emailData.status,
      sentAt: emailData.sentAt || Date.now(),
      errorMessage: emailData.errorMessage,
      retryCount: emailData.retryCount || 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          pk: 'EMAIL_LOG',
          sk: emailLog.id,
          ...emailLog,
        },
      })
    );

    await createAuditLog(auth, 'CREATE_EMAIL_LOG', { emailLogId: emailLog.id });

    return createResponse(201, emailLog);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Forbidden')) {
      return createResponse(403, { error: message });
    }
    return createResponse(500, { error: message });
  }
}

async function getEmailLog(
  event: APIGatewayProxyEvent,
  auth: AuthContext
): Promise<APIGatewayProxyResult> {
  try {
    requirePermission(auth, 'email_logs:read');

    const emailLogId = event.pathParameters?.id;
    if (!emailLogId || !validateUUID(emailLogId)) {
      return createResponse(400, { error: 'Invalid email log ID' });
    }

    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { pk: 'EMAIL_LOG', sk: emailLogId },
      })
    );

    if (!result.Item) {
      return createResponse(404, { error: 'Email log not found' });
    }

    await createAuditLog(auth, 'GET_EMAIL_LOG', { emailLogId });

    return createResponse(200, result.Item);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Forbidden')) {
      return createResponse(403, { error: message });
    }
    return createResponse(500, { error: message });
  }
}

async function updateEmailLog(
  event: APIGatewayProxyEvent,
  auth: AuthContext
): Promise<APIGatewayProxyResult> {
  try {
    requirePermission(auth, 'email_logs:update');

    const emailLogId = event.pathParameters?.id;
    if (!emailLogId || !validateUUID(emailLogId)) {
      return createResponse(400, { error: 'Invalid email log ID' });
    }

    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const updateData = JSON.parse(event.body) as Partial<EmailLog>;

    const updateExpression = Object.keys(updateData)
      .map((key, index) => `${key} = :val${index}`)
      .join(', ');

    const expressionAttributeValues = Object.entries(updateData).reduce(
      (acc, [key, value], index) => {
        acc[`:val${index}`] = value;
        return acc;
      },
      { ':updatedAt': Date.now() } as Record<string, unknown>
    );

    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { pk: 'EMAIL_LOG', sk: emailLogId },
        UpdateExpression: `SET ${updateExpression}, updatedAt = :updatedAt`,
        ExpressionAttributeValues: expressionAttributeValues,
      })
    );

    await createAuditLog(auth, 'UPDATE_EMAIL_LOG', {
      emailLogId,
      updates: updateData,
    });

    return createResponse(200, { message: 'Email log updated successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Forbidden')) {
      return createResponse(403, { error: message });
    }
    return createResponse(500, { error: message });
  }
}

async function deleteEmailLog(
  event: APIGatewayProxyEvent,
  auth: AuthContext
): Promise<APIGatewayProxyResult> {
  try {
    requirePermission(auth, 'email_logs:delete');

    const emailLogId = event.pathParameters?.id;
    if (!emailLogId || !validateUUID(emailLogId)) {
      return createResponse(400, { error: 'Invalid email log ID' });
    }

    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { pk: 'EMAIL_LOG', sk: emailLogId },
      })
    );

    await createAuditLog(auth, 'DELETE_EMAIL_LOG', { emailLogId });

    return createResponse(200, { message: 'Email log deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Forbidden')) {
      return createResponse(403, { error: message });
    }
    return createResponse(500, { error: message });
  }
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const path = event.path || '';
  const method = event.httpMethod || 'GET';

  try {
    if (path === '/resources' && method === 'GET') {
      return await getResources(event);
    }

    const bulkMatch = path.match(/^\/api\/(\d+)\/bulk$/);
    if (bulkMatch && method === 'POST') {
      return await bulkImport(event, bulkMatch[1]);
    }

    const auth = extractAuthContext(event);

    if (path === '/users' && method === 'POST') {
      return await createUser(event, auth);
    }
    if (path.match(/^\/users\/[a-f0-9-]+$/) && method === 'GET') {
      return await getUser(event, auth);
    }
    if (path.match(/^\/users\/[a-f0-9-]+$/) && method === 'PUT') {
      return await updateUser(event, auth);
    }
    if (path.match(/^\/users\/[a-f0-9-]+$/) && method === 'DELETE') {
      return await deleteUser(event, auth);
    }

    if (path === '/departments' && method === 'POST') {
      return await createDepartment(event, auth);
    }
    if (path.match(/^\/departments\/[a-f0-9-]+$/) && method === 'GET') {
      return await getDepartment(event, auth);
    }
    if (path.match(/^\/departments\/[a-f0-9-]+$/) && method === 'PUT') {
      return await updateDepartment(event, auth);
    }
    if (path.match(/^\/departments\/[a-f0-9-]+$/) && method === 'DELETE') {
      return await deleteDepartment(event, auth);
    }

    if (path === '/reports' && method === 'POST') {
      return await createReport(event, auth);
    }
    if (path.match(/^\/reports\/[a-f0-9-]+$/) && method === 'GET') {
      return await getReport(event, auth);
    }
    if (path.match(/^\/reports\/[a-f0-9-]+$/) && method === 'PUT') {
      return await updateReport(event, auth);
    }
    if (path.match(/^\/reports\/[a-f0-9-]+$/) && method === 'DELETE') {
      return await deleteReport(event, auth);
    }

    if (path === '/submission-histories' && method === 'POST') {
      return await createSubmissionHistory(event, auth);
    }
    if (path.match(/^\/submission-histories\/[a-f0-9-]+$/) && method === 'GET') {
      return await getSubmissionHistory(event, auth);
    }
    if (path.match(/^\/submission-histories\/[a-f0-9-]+$/) && method === 'PUT') {
      return await updateSubmissionHistory(event, auth);
    }
    if (path.match(/^\/submission-histories\/[a-f0-9-]+$/) && method === 'DELETE') {
      return await deleteSubmissionHistory(event, auth);
    }

    if (path === '/email-logs' && method === 'POST') {
      return await createEmailLog(event, auth);
    }
    if (path.match(/^\/email-logs\/[a-f0-9-]+$/) && method === 'GET') {
      return await getEmailLog(event, auth);
    }
    if (path.match(/^\/email-logs\/[a-f0-9-]+$/) && method === 'PUT') {
      return await updateEmailLog(event, auth);
    }
    if (path.match(/^\/email-logs\/[a-f0-9-]+$/) && method === 'DELETE') {
      return await deleteEmailLog(event, auth);
    }

    return createResponse(404, { error: 'Not found' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Missing Authorization') || message.includes('Invalid token')) {
      return createResponse(401, { error: message });
    }
    if (message.includes('Forbidden')) {
      return createResponse(403, { error: message });
    }
    return createResponse(500, { error: message });
  }
};