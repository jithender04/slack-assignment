import { Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import { customRequest } from './types';

export function verifyToken(req : customRequest, res: Response, next: NextFunction) {
  const token: string | undefined = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    const decoded:any = jwt.verify(token, process.env.JWT_SECRET || '');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

