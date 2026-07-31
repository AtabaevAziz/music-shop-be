import { Role } from '../../common/enums/role.enum';

export type SessionDto = {
  role: Role;
  name: string;
  employeeId?: string;
  customerId?: string;
};
