import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { customRequest, userRequestBody } from '../types';
import User from '../models/user.model';

const router = express.Router();

router.post('/register', async (req: customRequest, res: Response): Promise<void> => {
  try {
    const { username, password }: userRequestBody = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      username,
      password: hashedPassword
    });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req: customRequest, res: Response): Promise<void> => {
  try {
    const { username, password }: userRequestBody = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      res.status(401).json({ error: 'Authentication failed' });
      return;
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Authentication failed' });
      return;
    }
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      {
        expiresIn: '1h'
      }
    );
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
