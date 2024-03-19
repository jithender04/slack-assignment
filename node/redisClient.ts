import { createClient } from 'redis';
import 'dotenv/config';
// setting up redis connection
export const client = createClient({
    password: process.env.REDIS_PWD,
    socket: {
      host: 'redis-15717.c305.ap-south-1-1.ec2.cloud.redislabs.com',
      port: 15717
    }
});

