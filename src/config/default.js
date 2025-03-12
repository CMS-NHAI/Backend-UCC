import {S3Client, PutObjectCommand,ListBucketsCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

export default {
    redisCacheExpiresIn: 60,
    refreshTokenExpiresIn: 60,
    accessTokenExpiresIn: 15,
    origin: 'http://localhost:3000',
  };

  export const s3Client = new S3Client({
      region: process.env.AWS_REGION ,
      credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID ,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY 
      }
  });