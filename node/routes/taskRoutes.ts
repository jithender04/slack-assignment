import express, { Response, Router } from 'express';
import {verifyToken} from '../auth';
import { customRequest , taskRequestBody } from '../types';
import Task from '../models/task.model';
import {client} from '../redisClient'
const router: Router = express.Router();

type Task = {
  _id: any,
  title: string,
  description?: string,
  dueDate: Date,
  assignee?: string
}

const setInCache = async (key:string, value: any): Promise<any> => await client.json.set(key,'$',value);

const deleteInCache = async (key:string): Promise<any> => await client.del(key);

const createTask = async (req: customRequest, res: Response) : Promise<void> => {
  try {
    const { title, description, status, dueDate, assignee } : taskRequestBody = req.body;
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
      userId: userId,
      assignee: assignee || 'unassigned'
    });
    setInCache(task._id.toString() , task);
    res.status(201).json(task);
  } catch (error: any) {
    res.status(500).json({ message: error.message + "caught" });
  }
};

const getTasks = async (req: customRequest, res: Response) : Promise<void> => {
    try {
      const userId = req.userId as string;
      let query: { userId: string, status?: string, assignee?: string, sortByDueDate?: string }  = {userId};
      if(req.query.status) {
        query.status = req.query.status as string;
      }
      if(req.query.assignee) {
        query.assignee = req.query.assignee as string;
      }
      let tasks;
      if (req.query.sortByDueDate === 'asc') {
        tasks = await Task.find(query).sort({dueDate: 1});
      } else if (req.query.sortByDueDate === 'desc') {
        tasks = await Task.find(query).sort({dueDate: -1});
      } else {
        tasks = await Task.find(query);
      }
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
};

const getTask = async (req: customRequest, res: Response) => {
  try {
    const { id }: { id?: string } = req.params;
    var cache: any =  await client.json.get(id);
    if (cache && cache._id) {
      res.json(cache);
    } else {
      let task = await Task.findById(id);
      res.json(task);
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

const updateTasks = async (req: customRequest, res: Response) : Promise<void> => {
    try {
      const { id }: { id?: string } = req.params;
      const { title, description, status, dueDate, assignee } : taskRequestBody = req.body;
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
          userId: userId,
          assignee: assignee || 'unassigned',
        },
        { new: true }
      );

      if (!task) {
        res.status(404).json({ message: 'Task not found' });
        return;
      }
      setInCache(task._id.toString() , task);
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
      deleteInCache(id);
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
router.route('/:id').put(verifyToken, updateTasks).delete(verifyToken, deleteTasks).get(verifyToken, getTask);

export default router;