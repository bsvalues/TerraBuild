// Type definitions to extend Express Request

import { User } from '@shared/schema';

declare global {
  namespace Express {
    export interface Request {
      user?: User;
      project?: any;
      projectMember?: any;
    }
  }
}