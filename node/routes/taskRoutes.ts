import express, { Response, Router } from 'express';
import {verifyToken} from '../auth';
import { customRequest , taskRequestBody } from '../types';
import Task from '../models/task.model';

// const CACHE_EXPIRATION_TIME: number = 60;
const router: Router = express.Router();

// const getFromCache = async (key: string): Promise<any> => await client.get('key');

// const setInCache = async (key:string, value: any): Promise<any> => await client.set('key', value, 'EX', CACHE_EXPIRATION_TIME);

const createTask = async (req: customRequest, res: Response) : Promise<void> => {
  try {
    const { title, description, status, dueDate } : taskRequestBody = req.body;
    const userId = req.userId;

    var isoDate: Date | undefined;
    if (dueDate) {
      const [day, month, year] = dueDate.split('/');
      isoDate = new Date(`${year}-${month}-${day}`);
    }

    const task = await Task.create({
      title,
      description: description || '',
      status,
      dueDate: isoDate,
      userId: userId
    });
    res.status(201).json(task);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

const getTasks = async (req: customRequest, res: Response) : Promise<void> => {
    try {
      const userId = req.userId as string;
      let query: { userId: string, status?: string }  = {userId};
      if(req.query.status) {
        query.status = req.query.status as string;
      }
      const tasks = await Task.find(query);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
};

const updateTasks = async (req: customRequest, res: Response) : Promise<void> => {
    try {
      const { id }: { id?: string } = req.params;
      const { title, description, status, dueDate } : taskRequestBody = req.body;
      const userId = req.userId;

      var isoDate: Date | undefined;
      if (dueDate) {
        const [day, month, year] = dueDate.split('/');
        isoDate = new Date(`${year}-${month}-${day}`);
      }

      const task = await Task.findOneAndUpdate(
        { _id: id, userId },
        {
          title,
          description: description || '',
          status,
          dueDate: isoDate,
          userId: userId
        },
        { new: true }
      );

      if (!task) {
        res.status(404).json({ message: 'Task not found' });
        return;
      }
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
};

const deleteTasks = async (req: customRequest, res: Response): Promise<void> => {
    try {
      const { id }: { id?: string } = req.params;
      const userId = req.userId;

      const task = await Task.findOneAndDelete({ _id: id, userId });

      if (!task) {
        res.status(404).json({ message: 'Task not found' });
        return;
      }
      res.json({message: 'Task successfully deleted'});
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
};

router.route('/').post(verifyToken, createTask).get(verifyToken, getTasks);
router.route('/:id').put(verifyToken, updateTasks).delete(verifyToken, deleteTasks);

export default router;