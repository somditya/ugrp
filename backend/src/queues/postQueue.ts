import { Queue } from 'bullmq';
import { getRedis } from '@utils/redis';

const createQueue = () => {
  const redis = getRedis();
  return new Queue('post-operations', { connection: redis });
};

let queueInstance: ReturnType<typeof createQueue> | null = null;

export function getPostQueue() {
  if (!queueInstance) queueInstance = createQueue();
  return queueInstance;
}

export async function enqueuePostDeletion(postId: string) {
  const queue = getPostQueue();
  await queue.add('delete-post', { postId }, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
}

export async function enqueueNotification(userId: string, message: string) {
  const queue = getPostQueue();
  await queue.add('user-notification', { userId, message });
}
