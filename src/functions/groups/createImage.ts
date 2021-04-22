import {
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda';
import 'source-map-support/register';
import * as AWS from 'aws-sdk';
import { v4 as uuid } from 'uuid';

const docClient = new AWS.DynamoDB.DocumentClient();

const s3 = new AWS.S3({
  signatureVersion: 'v4',
});

const groupsTable = process.env.GROUPS_TABLE;
const imagesTable = process.env.IMAGES_TABLE;
const bucketName = process.env.IMAGES_S3_BUCKET;
const urlExpiration = Number(process.env.SIGNED_URL_EXPIRATION);

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

  const imageUrl = getUploadUrl(imageId);

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      newItem,
      uploadUrl: imageUrl,
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
    imageUrl: `https://${bucketName}.s3.amazonaws.com/${imageId}`,
  };

  await docClient
    .put({
      TableName: imagesTable,
      Item: newItem,
    })
    .promise();

  return newItem;
}

function getUploadUrl(imageId: string) {
  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: imageId,
    Expires: urlExpiration,
  });
}
