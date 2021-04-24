import { DynamoDBStreamEvent, DynamoDBStreamHandler } from 'aws-lambda';
import 'source-map-support/register';
import * as elasticsearch from 'elasticsearch';
import * as httpAwsWs from 'http-aws-es';

const esHost = process.env.ES_ENDPOINT;

const es = new elasticsearch.Client({
  host: [esHost],
  connectionClass: httpAwsWs,
});

export const handler: DynamoDBStreamHandler = async (
  event: DynamoDBStreamEvent
) => {
  console.log('Processing event batch from DynamoDB: ', JSON.stringify(event));

  for (let record of event.Records) {
    console.log(`Processing record: ${JSON.stringify(record)}`);

    if (record.eventName !== 'INSERT') {
      continue;
    }

    const newItem = record.dynamodb.NewImage;
    const imageId = newItem.imageId.S;

    const body = {
      imageId: newItem.imageId.S,
      groupId: newItem.groupId.S,
      imageUrl: newItem.imageUrl.S,
      title: newItem.title.S,
      timestamp: newItem.timestamp.S,
    };

    await es.index({
      index: 'images-index',
      type: 'images',
      id: imageId,
      body,
    });
  }
};
