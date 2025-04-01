import { Request as ExpressRequest } from 'express';
import { User } from '../shared/schema';

// Extend the Express Request interface to include user property
export interface Request extends ExpressRequest {
  user?: User;
}