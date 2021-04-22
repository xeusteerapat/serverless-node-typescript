import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda';
import 'source-map-support/register';
import * as AWS from 'aws-sdk';
import { v4 as uuid } from 'uuid';

const docClient = new AWS.DynamoDB.DocumentClient();

const groupsTable = process.env.GROUPS_TABLE;
const imagesTable = process.env.IMAGES_TABLE;

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Caller event', event);
  const groupId = event.pathParameters.groupId;
  const isValidGroupId = await isGroupExist(groupId);

  if (!isValidGroupId) {
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Group does not exist',
      }),
    };
  }

  const imageId = uuid();
  const newItem = await createImage(groupId, imageId, event);

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      newItem,
    }),
  };
};

async function isGroupExist(groupId: string) {
  const result = await docClient
    .get({
      TableName: groupsTable,
      Key: {
        id: groupId,
      },
    })
    .promise();

  return !!result.Item;
}

async function createImage(
  groupId: string,
  imageId: string,
  event: APIGatewayProxyEvent
) {
  const newImage = JSON.parse(event.body);
  const newItem = {
    groupId,
    timestamp: new Date().toISOString(),
    imageId,
    ...newImage,
  };

  await docClient
    .put({
      TableName: imagesTable,
      Item: newItem,
    })
    .promise();

  return newItem;
}
