import express from 'express';
import mongoose from 'mongoose';
import userRoutes from './routes/userRoutes';
import taskRoutes from './routes/taskRoutes';
import 'dotenv/config';
import {client} from './redisClient'
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

    client
      .connect()
      .then(() => {
        console.log('Redis connected ::>');
      })
      .catch((err) => {
        console.log('error :', err);
      });
      
  })
  .catch(() => console.log('Connection failed!'));

//  routes
app.use('/api/tasks', taskRoutes);
app.use('/api', userRoutes);
