const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { PrismaClient } = require('@prisma/client');

require('dotenv').config();

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const connection = new IORedis(REDIS_URL);
const prisma = new PrismaClient();

// Worker to process notification jobs
const worker = new Worker('notifications', async job => {
  const { userId, type, data } = job.data;
  // create DB notification
  const notif = await prisma.notification.create({ data: { userId, type, data } });
  // attempt to emit via socket.io: we cannot import the server io here, so this worker's main job is persistent storage and usually you'd use a pub/sub or emit through a message bus
  // For prototype: log it and leave it to server to pull notifications on connect or use Redis pub/sub for cross-process emission
  console.log('Processed notification for', userId, type);
  return notif;
}, { connection });

worker.on('completed', job => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error('job failed', job.id, err);
});

console.log('Notification worker started');
