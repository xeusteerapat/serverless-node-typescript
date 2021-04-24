import {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
  APIGatewayAuthorizerHandler,
} from 'aws-lambda';
import 'source-map-support/register';

export const handler: APIGatewayAuthorizerHandler = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  try {
    verifyToken(event.authorizationToken);
    console.log('User was authorized');

    return {
      principalId: 'user',
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

function verifyToken(authHeader: string) {
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  if (!authHeader.toLocaleLowerCase().startsWith('bearer ')) {
    throw new Error('Invalid authorization header');
  }

  const split = authHeader.split(' ');
  const token = split[1];
}
