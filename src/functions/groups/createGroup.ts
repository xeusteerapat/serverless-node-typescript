import {
  APIGatewayProxyResult,
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
} from 'aws-lambda';
import 'source-map-support/register';
import * as AWS from 'aws-sdk';
import { v4 as uuid } from 'uuid';

const docClient = new AWS.DynamoDB.DocumentClient();

const groupsTable = process.env.GROUPS_TABLE;

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Processing event: ', event);
  const itemId = uuid();

  const newItem = {
    id: itemId,
    ...JSON.parse(event.body),
  };

  await docClient
    .put({
      TableName: groupsTable,
      Item: newItem,
    })
    .promise();

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      newItem,
    }),
  };
};
