import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda';
import 'source-map-support/register';
import * as AWS from 'aws-sdk';

const docClient = new AWS.DynamoDB.DocumentClient();
const connectionsTable = process.env.CONNECTIONS_TABLE;

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Caller event', event);

  const connectionId = event.requestContext.connectionId;

  const item = {
    id: connectionId,
    timestamp: new Date().toISOString(),
  };

  await docClient
    .put({
      TableName: connectionsTable,
      Item: item,
    })
    .promise();

  return {
    statusCode: 200,
    body: 'Web socket connected',
  };
};
