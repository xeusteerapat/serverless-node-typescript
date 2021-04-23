import { S3Handler, S3Event } from 'aws-lambda';
import 'source-map-support';

export const handler: S3Handler = async (event: S3Event) => {
  for (let record of event.Records) {
    const { key } = record.s3.object;
    console.log('Processing S3 item with key: ', key);
  }
};
