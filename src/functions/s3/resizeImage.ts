import { S3EventRecord, SNSEvent, SNSHandler } from 'aws-lambda';
import 'source-map-support/register';
import * as AWS from 'aws-sdk';
import Jimp from 'jimp/es';

const s3 = new AWS.S3();

const imagesBucketName = process.env.IMAGES_S3_BUCKET;
const thumbnailBucketName = process.env.THUMBBAILS_S3_BUCKET;

export const handler: SNSHandler = async (event: SNSEvent) => {
  console.log('Processing SNS event ', JSON.stringify(event));

  for (let snsRecord of event.Records) {
    const s3EventStr = snsRecord.Sns.Message;
    console.log('Processing S3 event', s3EventStr);

    const s3Event = JSON.parse(s3EventStr);

    for (let record of s3Event.Record) {
      await resizeImage(record);
    }
  }
};

async function resizeImage(record: S3EventRecord) {
  const key = record.s3.object.key;

  // get image from bucket
  const response = await s3
    .getObject({
      Bucket: imagesBucketName,
      Key: key,
    })
    .promise();

  const body: Buffer = response.Body as Buffer;

  // Read an image with the Jimp library
  const image = await Jimp.read(body);

  // Resize an image maintaining the ratio between the image's width and height
  image.resize(150, Jimp.AUTO);

  // Convert an image to a buffer that we can write to a different bucket
  const convertedBuffer = await image.getBufferAsync(Jimp.AUTO.toString());

  await s3
    .putObject({
      Bucket: thumbnailBucketName,
      Key: `${key}.jpeg`,
      Body: convertedBuffer,
    })
    .promise();
}
