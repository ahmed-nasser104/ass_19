import type { UserRole } from '../user/schemas/user.schema.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}
