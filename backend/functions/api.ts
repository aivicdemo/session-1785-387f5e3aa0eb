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
import { v4 as uuidv4 } from 'uuid';
import {
  extractAuthContext,
  requirePermission,
  AuthContext,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from './rbac';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-1' });
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.MAIN_TABLE || 'morning-report-table';

interface ApiResponse {
  statusCode: number;
  body: string;
}

function response(statusCode: number, data: unknown): ApiResponse {
  return {
    statusCode,
    body: JSON.stringify(data),
  };
}

function errorResponse(statusCode: number, message: string): ApiResponse {
  return response(statusCode, { error: message });
}

async function createAuditLog(
  context: AuthContext,
  action: string,
  resourceType: string,
  resourceId: string,
  details: Record<string, unknown>
): Promise<void> {
  const auditId = uuidv4();
  const now = new Date().toISOString();
  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        pk: 'AUDIT',
        sk: `${now}#${auditId}`,
        auditId,
        userId: context.userId,
        action,
        resourceType,
        resourceId,
        details,
        timestamp: now,
        createdAt: now,
        updatedAt: now,
      },
    })
  );
}

async function getResources(event: APIGatewayProxyEvent): Promise<ApiResponse> {
  try {
    const context = extractAuthContext(event);
    requirePermission(context, 'users:read');

    const result = await docClient.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: 'attribute_exists(#pk) AND begins_with(#pk, :prefix)',
        ExpressionAttributeNames: {
          '#pk': 'pk',
        },
        ExpressionAttributeValues: {
          ':prefix': 'USER#',
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
    if (error instanceof ValidationError) {
      return errorResponse(400, error.message);
    }
    console.error('Error in getResources:', error);
    return errorResponse(500, 'Internal server error');
  }
}

async function bulkImportUsers(
  event: APIGatewayProxyEvent,
  context: AuthContext
): Promise<ApiResponse> {
  try {
    requirePermission(context, 'bulk:import');

    const body = JSON.parse(event.body || '{}');
    const items = body.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse(400, 'Invalid request: items must be a non-empty array');
    }

    const now = new Date().toISOString();
    const processedItems = items.map((item: Record<string, unknown>) => ({
      ...item,
      pk: `USER#${item.userId || uuidv4()}`,
      sk: `METADATA#${item.userId || uuidv4()}`,
      id: item.userId || uuidv4(),
      createdAt: now,
      updatedAt: now,
    }));

    const chunks = [];
    for (let i = 0; i < processedItems.length; i += 25) {
      chunks.push(processedItems.slice(i, i + 25));
    }

    let imported = 0;
    const errors: string[] = [];

    for (const chunk of chunks) {
      const writeRequests = chunk.map((item) => ({
        PutRequest: {
          Item: {
            pk: { S: item.pk },
            sk: { S: item.sk },
            ...Object.entries(item).reduce(
              (acc, [key, value]) => {
                if (key !== 'pk' && key !== 'sk') {
                  if (typeof value === 'string') {
                    acc[key] = { S: value };
                  } else if (typeof value === 'number') {
                    acc[key] = { N: value.toString() };
                  } else if (typeof value === 'boolean') {
                    acc[key] = { BOOL: value };
                  }
                }
                return acc;
              },
              {} as Record<string, unknown>
            ),
          },
        },
      }));

      const batchInput: BatchWriteItemCommandInput = {
        RequestItems: {
          [tableName]: writeRequests,
        },
      };

      try {
        await client.send(new BatchWriteItemCommand(batchInput));
        imported += chunk.length;
      } catch (err) {
        errors.push(`Batch write failed: ${String(err)}`);
      }
    }

    await createAuditLog(context, 'BULK_IMPORT', 'USER', 'BATCH', {
      imported,
      total: items.length,
      errors,
    });

    return response(200, {
      imported,
      failed: items.length - imported,
      errors,
    });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return errorResponse(403, error.message);
    }
    if (error instanceof ValidationError) {
      return errorResponse(400, error.message);
    }
    console.error('Error in bulkImportUsers:', error);
    return errorResponse(500, 'Internal server error');
  }
}

async function bulkImportDepartments(
  event: APIGatewayProxyEvent,
  context: AuthContext
): Promise<ApiResponse> {
  try {
    requirePermission(context, 'bulk:import');

    const body = JSON.parse(event.body || '{}');
    const items = body.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse(400, 'Invalid request: items must be a non-empty array');
    }

    const now = new Date().toISOString();
    const processedItems = items.map((item: Record<string, unknown>) => ({
      ...item,
      pk: `DEPT#${item.departmentId || uuidv4()}`,
      sk: `METADATA#${item.departmentId || uuidv4()}`,
      id: item.departmentId || uuidv4(),
      createdAt: now,
      updatedAt: now,
    }));

    const chunks = [];
    for (let i = 0; i < processedItems.length; i += 25) {
      chunks.push(processedItems.slice(i, i + 25));
    }

    let imported = 0;
    const errors: string[] = [];

    for (const chunk of chunks) {
      const writeRequests = chunk.map((item) => ({
        PutRequest: {
          Item: {
            pk: { S: item.pk },
            sk: { S: item.sk },
            ...Object.entries(item).reduce(
              (acc, [key, value]) => {
                if (key !== 'pk' && key !== 'sk') {
                  if (typeof value === 'string') {
                    acc[key] = { S: value };
                  } else if (typeof value === 'number') {
                    acc[key] = { N: value.toString() };
                  } else if (typeof value === 'boolean') {
                    acc[key] = { BOOL: value };
                  }
                }
                return acc;
              },
              {} as Record<string, unknown>
            ),
          },
        },
      }));

      const batchInput: BatchWriteItemCommandInput = {
        RequestItems: {
          [tableName]: writeRequests,
        },
      };

      try {
        await client.send(new BatchWriteItemCommand(batchInput));
        imported += chunk.length;
      } catch (err) {
        errors.push(`Batch write failed: ${String(err)}`);
      }
    }

    await createAuditLog(context, 'BULK_IMPORT', 'DEPARTMENT', 'BATCH', {
      imported,
      total: items.length,
      errors,
    });

    return response(200, {
      imported,
      failed: items.length - imported,
      errors,
    });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return errorResponse(403, error.message);
    }
    if (error instanceof ValidationError) {
      return errorResponse(400, error.message);
    }
    console.error('Error in bulkImportDepartments:', error);
    return errorResponse(500, 'Internal server error');
  }
}

async function bulkImportReports(
  event: APIGatewayProxyEvent,
  context: AuthContext
): Promise<ApiResponse> {
  try {
    requirePermission(context, 'bulk:import');

    const body = JSON.parse(event.body || '{}');
    const items = body.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse(400, 'Invalid request: items must be a non-empty array');
    }

    const now = new Date().toISOString();
    const processedItems = items.map((item: Record<string, unknown>) => ({
      ...item,
      pk: `REPORT#${item.reportId || uuidv4()}`,
      sk: `METADATA#${item.reportId || uuidv4()}`,
      id: item.reportId || uuidv4(),
      createdAt: now,
      updatedAt: now,
    }));

    const chunks = [];
    for (let i = 0; i < processedItems.length; i += 25) {
      chunks.push(processedItems.slice(i, i + 25));
    }

    let imported = 0;
    const errors: string[] = [];

    for (const chunk of chunks) {
      const writeRequests = chunk.map((item) => ({
        PutRequest: {
          Item: {
            pk: { S: item.pk },
            sk: { S: item.sk },
            ...Object.entries(item).reduce(
              (acc, [key, value]) => {
                if (key !== 'pk' && key !== 'sk') {
                  if (typeof value === 'string') {
                    acc[key] = { S: value };
                  } else if (typeof value === 'number') {
                    acc[key] = { N: value.toString() };
                  } else if (typeof value === 'boolean') {
                    acc[key] = { BOOL: value };
                  }
                }
                return acc;
              },
              {} as Record<string, unknown>
            ),
          },
        },
      }));

      const batchInput: BatchWriteItemCommandInput = {
        RequestItems: {
          [tableName]: writeRequests,
        },
      };

      try {
        await client.send(new BatchWriteItemCommand(batchInput));
        imported += chunk.length;
      } catch (err) {
        errors.push(`Batch write failed: ${String(err)}`);
      }
    }

    await createAuditLog(context, 'BULK_IMPORT', 'REPORT', 'BATCH', {
      imported,
      total: items.length,
      errors,
    });

    return response(200, {
      imported,
      failed: items.length - imported,
      errors,
    });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return errorResponse(403, error.message);
    }
    if (error instanceof ValidationError) {
      return errorResponse(400, error.message);
    }
    console.error('Error in bulkImportReports:', error);
    return errorResponse(500, 'Internal server error');
  }
}

async function bulkImportSubmissions(
  event: APIGatewayProxyEvent,
  context: AuthContext
): Promise<ApiResponse> {
  try {
    requirePermission(context, 'bulk:import');

    const body = JSON.parse(event.body || '{}');
    const items = body.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse(400, 'Invalid request: items must be a non-empty array');
    }

    const now = new Date().toISOString();
    const processedItems = items.map((item: Record<string, unknown>) => ({
      ...item,
      pk: `SUBMISSION#${item.submissionId || uuidv4()}`,
      sk: `METADATA#${item.submissionId || uuidv4()}`,
      id: item.submissionId || uuidv4(),
      createdAt: now,
      updatedAt: now,
    }));

    const chunks = [];
    for (let i = 0; i < processedItems.length; i += 25) {
      chunks.push(processedItems.slice(i, i + 25));
    }

    let imported = 0;
    const errors: string[] = [];

    for (const chunk of chunks) {
      const writeRequests = chunk.map((item) => ({
        PutRequest: {
          Item: {
            pk: { S: item.pk },
            sk: { S: item.sk },
            ...Object.entries(item).reduce(
              (acc, [key, value]) => {
                if (key !== 'pk' && key !== 'sk') {
                  if (typeof value === 'string') {
                    acc[key] = { S: value };
                  } else if (typeof value === 'number') {
                    acc[key] = { N: value.toString() };
                  } else if (typeof value === 'boolean') {
                    acc[key] = { BOOL: value };
                  }
                }
                return acc;
              },
              {} as Record<string, unknown>
            ),
          },
        },
      }));

      const batchInput: BatchWriteItemCommandInput = {
        RequestItems: {
          [tableName]: writeRequests,
        },
      };

      try {
        await client.send(new BatchWriteItemCommand(batchInput));
        imported += chunk.length;
      } catch (err) {
        errors.push(`Batch write failed: ${String(err)}`);
      }
    }

    await createAuditLog(context, 'BULK_IMPORT', 'SUBMISSION', 'BATCH', {
      imported,
      total: items.length,
      errors,
    });

    return response(200, {
      imported,
      failed: items.length - imported,
      errors,
    });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return errorResponse(403, error.message);
    }
    if (error instanceof ValidationError) {
      return errorResponse(400, error.message);
    }
    console.error('Error in bulkImportSubmissions:', error);
    return errorResponse(500, 'Internal server error');
  }
}

async function bulkImportMailLogs(
  event: APIGatewayProxyEvent,
  context: AuthContext
): Promise<ApiResponse> {
  try {
    requirePermission(context, 'bulk:import');

    const body = JSON.parse(event.body || '{}');
    const items = body.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse(400, 'Invalid request: items must be a non-empty array');
    }

    const now = new Date().toISOString();
    const processedItems = items.map((item: Record<string, unknown>) => ({
      ...item,
      pk: `MAILLOG#${item.mailLogId || uuidv4()}`,
      sk: `METADATA#${item.mailLogId || uuidv4()}`,
      id: item.mailLogId || uuidv4(),
      createdAt: now,
      updatedAt: now,
    }));

    const chunks = [];
    for (let i = 0; i < processedItems.length; i += 25) {
      chunks.push(processedItems.slice(i, i + 25));
    }

    let imported = 0;
    const errors: string[] = [];

    for (const chunk of chunks) {
      const writeRequests = chunk.map((item) => ({
        PutRequest: {
          Item: {
            pk: { S: item.pk },
            sk: { S: item.sk },
            ...Object.entries(item).reduce(
              (acc, [key, value]) => {
                if (key !== 'pk' && key !== 'sk') {
                  if (typeof value === 'string') {
                    acc[key] = { S: value };
                  } else if (typeof value === 'number') {
                    acc[key] = { N: value.toString() };
                  } else if (typeof value === 'boolean') {
                    acc[key] = { BOOL: value };
                  }
                }
                return acc;
              },
              {} as Record<string, unknown>
            ),
          },
        },
      }));

      const batchInput: BatchWriteItemCommandInput = {
        RequestItems: {
          [tableName]: writeRequests,
        },
      };

      try {
        await client.send(new BatchWriteItemCommand(batchInput));
        imported += chunk.length;
      } catch (err) {
        errors.push(`Batch write failed: ${String(err)}`);
      }
    }

    await createAuditLog(context, 'BULK_IMPORT', 'MAILLOG', 'BATCH', {
      imported,
      total: items.length,
      errors,
    });

    return response(200, {
      imported,
      failed: items.length - imported,
      errors,
    });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return errorResponse(403, error.message);
    }
    if (error instanceof ValidationError) {
      return errorResponse(400, error.message);
    }
    console.error('Error in bulkImportMailLogs:', error);
    return errorResponse(500, 'Internal server error');
  }
}

export async function handler(event: APIGatewayProxyEvent): Promise<ApiResponse> {
  const context = extractAuthContext(event);
  const path = event.path || '';
  const method = event.httpMethod || 'GET';

  try {
    if (method === 'GET' && path === '/resources') {
      return await getResources(event);
    }

    if (method === 'POST' && path === '/api/0/bulk') {
      return await bulkImportUsers(event, context);
    }

    if (method === 'POST' && path === '/api/1/bulk') {
      return await bulkImportDepartments(event, context);
    }

    if (method === 'POST' && path === '/api/2/bulk') {
      return await bulkImportReports(event, context);
    }

    if (method === 'POST' && path === '/api/3/bulk') {
      return await bulkImportSubmissions(event, context);
    }

    if (method === 'POST' && path === '/api/4/bulk') {
      return await bulkImportMailLogs(event, context);
    }

    return errorResponse(404, 'Not found');
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return errorResponse(403, error.message);
    }
    if (error instanceof NotFoundError) {
      return errorResponse(404, error.message);
    }
    if (error instanceof ValidationError) {
      return errorResponse(400, error.message);
    }
    console.error('Unhandled error:', error);
    return errorResponse(500, 'Internal server error');
  }
}