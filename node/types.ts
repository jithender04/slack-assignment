import { Request, Response, NextFunction} from 'express';

export interface customRequest extends Request { 
    userId?: string;
}
export interface taskRequestBody {
    title: string, description?: string, status: string, dueDate?: string
}
export interface userRequestBody {
    username: string, password: string
}