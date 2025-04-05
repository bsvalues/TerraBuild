import { IStorage } from '../storage';
import { User } from '@shared/schema';

// Extend Express Request interface to add storage property
declare namespace Express {
  export interface Request {
    storage: IStorage;
    user?: User;
  }
}