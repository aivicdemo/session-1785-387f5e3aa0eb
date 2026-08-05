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
import {
  extractAuthContext,
  requirePermission,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from './rbac';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.MAIN_TABLE || 'morning-report-table';

interface ApiResponse {
  statusCode: number;
  body: string;
  headers?: Record<string, string>;
}

function response(statusCode: number, data: unknown): ApiResponse {
  return {
    statusCode,
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  };
}

function errorResponse(statusCode: number, message: string): ApiResponse {
  return response(statusCode, { error: message });
}

async function createAuditLog(
  action: string,
  resource: string,
  userId: string,
  details: Record<string, unknown>
): Promise<void> {
  const auditId = randomUUID();
  const now = new Date().toISOString();
  
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: 'AUDIT',
        sk: `${now}#${auditId}`,
        auditId,
        action,
        resource,
        userId,
        details,
        createdAt: now,
        updatedAt: now,
      },
    })
  );
}

// GET /resources - List all resources
async function handleGetResources(
  event: APIGatewayProxyEvent
): Promise<ApiResponse> {
  try {
    const authContext = extractAuthContext(event);
    requirePermission(authContext.role, 'users:read');

    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'attribute_exists(pk) AND pk <> :audit',
        ExpressionAttributeValues: {
          ':audit': 'AUDIT',
        },
      })
    );

    return response(200, {
      items: result.Items || [],
      count: result.Count || 0,
    });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return errorResponse(403, error.message);
    }
    console.error('Error in handleGetResources:', error);
    return errorResponse(500, 'Internal server error');
  }
}

// POST /api/users/bulk - Bulk import users
async function handleBulkUsers(
  event: APIGatewayProxyEvent
): Promise<ApiResponse> {
  try {
    const authContext = extractAuthContext(event);
    requirePermission(authContext.role, 'bulk:write');

    const body = JSON.parse(event.body || '{}');
    const items = body.items || [];

    if (!Array.isArray(items)) {
      return errorResponse(400, 'items must be an array');
    }

    const now = new Date().toISOString();
    const processedItems = items.map((item: Record<string, unknown>) => ({
      ...item,
      pk: 'USER',
      sk: item.userId || randomUUID(),
      id: item.userId || randomUUID(),
      createdAt: now,
      updatedAt: now,
    }));

    const { imported, failed, errors } = await batchWrite(
      processedItems,
      'USER'
    );

    await createAuditLog(
      'BULK_IMPORT',
      'users',
      authContext.userId,
      { imported, failed, itemCount: items.length }
    );

    return response(200, { imported, failed, errors });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return errorResponse(403, error.message);
    }
    if (error instanceof ValidationError) {
      return errorResponse(400, error.message);
    }
    console.error('Error in handleBulkUsers:', error);
    return errorResponse(500, 'Internal server error');
  }
}

// POST /api/departments/bulk - Bulk import departments
async function handleBulkDepartments(
  event: APIGatewayProxyEvent
): Promise<ApiResponse> {
  try {
    const authContext = extractAuthContext(event);
    requirePermission(authContext.role, 'bulk:write');

    const body = JSON.parse(event.body || '{}');
    const items = body.items || [];

    if (!Array.isArray(items)) {
      return errorResponse(400, 'items must be an array');
    }

    const now = new Date().toISOString();
    const processedItems = items.map((item: Record<string, unknown>) => ({
      ...item,
      pk: 'DEPARTMENT',
      sk: item.departmentId || randomUUID(),
      id: item.departmentId || randomUUID(),
      createdAt: now,
      updatedAt: now,
    }));

    const { imported, failed, errors } = await batchWrite(
      processedItems,
      'DEPARTMENT'
    );

    await createAuditLog(
      'BULK_IMPORT',
      'departments',
      authContext.userId,
      { imported, failed, itemCount: items.length }
    );

    return response(200, { imported, failed, errors });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return errorResponse(403, error.message);
    }
    if (error instanceof ValidationError) {
      return errorResponse(400, error.message);
    }
    console.error('Error in handleBulkDepartments:', error);
    return errorResponse(500, 'Internal server error');
  }
}

// POST /api/reports/bulk - Bulk import reports
async function handleBulkReports(
  event: APIGatewayProxyEvent
): Promise<ApiResponse> {
  try {
    const authContext = extractAuthContext(event);
    requirePermission(authContext.role, 'bulk:write');

    const body = JSON.parse(event.body || '{}');
    const items = body.items || [];

    if (!Array.isArray(items)) {
      return errorResponse(400, 'items must be an array');
    }

    const now = new Date().toISOString();
    const processedItems = items.map((item: Record<string, unknown>) => ({
      ...item,
      pk: 'REPORT',
      sk: item.reportId || randomUUID(),
      id: item.reportId || randomUUID(),
      createdAt: now,
      updatedAt: now,
    }));

    const { imported, failed, errors } = await batchWrite(
      processedItems,
      'REPORT'
    );

    await createAuditLog(
      'BULK_IMPORT',
      'reports',
      authContext.userId,
      { imported, failed, itemCount: items.length }
    );

    return response(200, { imported, failed, errors });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return errorResponse(403, error.message);
    }
    if (error instanceof ValidationError) {
      return errorResponse(400, error.message);
    }
    console.error('Error in handleBulkReports:', error);
    return errorResponse(500, 'Internal server error');
  }
}

// POST /api/sendhistory/bulk - Bulk import send history
async function handleBulkSendHistory(
  event: APIGatewayProxyEvent
): Promise<ApiResponse> {
  try {
    const authContext = extractAuthContext(event);
    requirePermission(authContext.role, 'bulk:write');

    const body = JSON.parse(event.body || '{}');
    const items = body.items || [];

    if (!Array.isArray(items)) {
      return errorResponse(400, 'items must be an array');
    }

    const now = new Date().toISOString();
    const processedItems = items.map((item: Record<string, unknown>) => ({
      ...item,
      pk: 'SENDHISTORY',
      sk: item.sendHistoryId || randomUUID(),
      id: item.sendHistoryId || randomUUID(),
      createdAt: now,
      updatedAt: now,
    }));

    const { imported, failed, errors } = await batchWrite(
      processedItems,
      'SENDHISTORY'
    );

    await createAuditLog(
      'BULK_IMPORT',
      'sendhistory',
      authContext.userId,
      { imported, failed, itemCount: items.length }
    );

    return response(200, { imported, failed, errors });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return errorResponse(403, error.message);
    }
    if (error instanceof ValidationError) {
      return errorResponse(400, error.message);
    }
    console.error('Error in handleBulkSendHistory:', error);
    return errorResponse(500, 'Internal server error');
  }
}

// POST /api/emaillog/bulk - Bulk import email logs
async function handleBulkEmailLog(
  event: APIGatewayProxyEvent
): Promise<ApiResponse> {
  try {
    const authContext = extractAuthContext(event);
    requirePermission(authContext.role, 'bulk:write');

    const body = JSON.parse(event.body || '{}');
    const items = body.items || [];

    if (!Array.isArray(items)) {
      return errorResponse(400, 'items must be an array');
    }

    const now = new Date().toISOString();
    const processedItems = items.map((item: Record<string, unknown>) => ({
      ...item,
      pk: 'EMAILLOG',
      sk: item.emailLogId || randomUUID(),
      id: item.emailLogId || randomUUID(),
      createdAt: now,
      updatedAt: now,
    }));

    const { imported, failed, errors } = await batchWrite(
      processedItems,
      'EMAILLOG'
    );

    await createAuditLog(
      'BULK_IMPORT',
      'emaillog',
      authContext.userId,
      { imported, failed, itemCount: items.length }
    );

    return response(200, { imported, failed, errors });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return errorResponse(403, error.message);
    }
    if (error instanceof ValidationError) {
      return errorResponse(400, error.message);
    }
    console.error('Error in handleBulkEmailLog:', error);
    return errorResponse(500, 'Internal server error');
  }
}

async function batchWrite(
  items: Record<string, unknown>[],
  resourceType: string
): Promise<{ imported: number; failed: number; errors: string[] }> {
  const errors: string[] = [];
  let imported = 0;
  let failed = 0;

  const chunks = [];
  for (let i = 0; i < items.length; i += 25) {
    chunks.push(items.slice(i, i + 25));
  }

  for (const chunk of chunks) {
    const writeRequests = chunk.map((item) => ({
      PutRequest: {
        Item: {
          pk: { S: item.pk as string },
          sk: { S: item.sk as string },
          ...Object.entries(item).reduce(
            (acc, [key, value]) => {
              if (key !== 'pk' && key !== 'sk') {
                acc[key] = { S: String(value) };
              }
              return acc;
            },
            {} as Record<string, { S: string }>
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
      failed += result.UnprocessedItems?.[TABLE_NAME]?.length || 0;

      if (result.UnprocessedItems?.[TABLE_NAME]?.length) {
        errors.push(
          `${result.UnprocessedItems[TABLE_NAME].length} items failed to write`
        );
      }
    } catch (error) {
      failed += chunk.length;
      errors.push(`Batch write failed: ${String(error)}`);
    }
  }

  return { imported, failed, errors };
}

// Main Lambda handler
export async function handler(
  event: APIGatewayProxyEvent
): Promise<ApiResponse> {
  const path = event.path || '';
  const method = event.httpMethod || 'GET';

  try {
    // GET /resources
    if (method === 'GET' && path === '/resources') {
      return await handleGetResources(event);
    }

    // POST /api/users/bulk
    if (method === 'POST' && path === '/api/users/bulk') {
      return await handleBulkUsers(event);
    }

    // POST /api/departments/bulk
    if (method === 'POST' && path === '/api/departments/bulk') {
      return await handleBulkDepartments(event);
    }

    // POST /api/reports/bulk
    if (method === 'POST' && path === '/api/reports/bulk') {
      return await handleBulkReports(event);
    }

    // POST /api/sendhistory/bulk
    if (method === 'POST' && path === '/api/sendhistory/bulk') {
      return await handleBulkSendHistory(event);
    }

    // POST /api/emaillog/bulk
    if (method === 'POST' && path === '/api/emaillog/bulk') {
      return await handleBulkEmailLog(event);
    }

    return errorResponse(404, 'Not found');
  } catch (error) {
    console.error('Unhandled error:', error);
    return errorResponse(500, 'Internal server error');
  }
}