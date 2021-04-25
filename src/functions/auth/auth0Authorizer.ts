import * as AWS from 'aws-sdk';
import {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
  APIGatewayAuthorizerHandler,
} from 'aws-lambda';
import 'source-map-support/register';
import { verify } from 'jsonwebtoken';
import { JwtToken } from '../../interfaces/JwtToken';

const secretId = process.env.AUTH_0_SECRET_ID;
const secretField = process.env.AUTH_0_SECRET_FIELD;

const client = new AWS.SecretsManager();

let cachedSecret: string;

export const handler: APIGatewayAuthorizerHandler = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  try {
    const decodedToken = await verifyToken(event.authorizationToken);
    console.log('User was authorized');

    return {
      principalId: decodedToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*',
          },
        ],
      },
    };
  } catch (error) {
    console.log(`Unauthorize ${error.message}`);

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*',
          },
        ],
      },
    };
  }
};

async function verifyToken(authHeader: string): Promise<JwtToken> {
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  if (!authHeader.toLocaleLowerCase().startsWith('bearer ')) {
    throw new Error('Invalid authorization header');
  }

  const split = authHeader.split(' ');
  const token = split[1];

  const secretObject: any = await getSecret();
  const secret = secretObject[secretField];

  return verify(token, secret) as JwtToken;
}

async function getSecret() {
  if (cachedSecret) return cachedSecret;

  const data = await client
    .getSecretValue({
      SecretId: secretId,
    })
    .promise();

  cachedSecret = data.SecretString;

  return JSON.parse(cachedSecret);
}
