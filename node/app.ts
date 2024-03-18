import express from 'express';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import userRoutes from './routes/userRoutes';
import taskRoutes from './routes/taskRoutes';
import 'dotenv/config';
const app = express();
app.use(express.json());

// setting up DB
mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => {
    console.log('Connected! to DB');
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on http://localhost:${process.env.PORT}`);
    });
  })
  .catch(() => console.log('Connection failed!'));

// setting up redis connection
const client = createClient({
  password: process.env.REDIS_PWD,
  socket: {
    host: 'redis-15717.c305.ap-south-1-1.ec2.cloud.redislabs.com',
    port: 15717
  }
});

(async () => {
    await client.connect();
})();

client.on('connect', () => console.log('::> Redis Client Connected'));
client.on('error', (err) => console.log('<:: Redis Client Error', err));

//  routes
app.use('/api/tasks', taskRoutes);
app.use('/api', userRoutes);
