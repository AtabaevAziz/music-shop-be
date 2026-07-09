import { Role } from '../../common/enums/role.enum';

export type SessionDto = {
  role: Role;
  name: string;
  customerId?: string;
};

