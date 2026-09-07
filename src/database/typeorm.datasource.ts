import "reflect-metadata";
import { DataSource } from "typeorm";
import { DATABASE_ENTITIES } from "./database.entities";

const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [...DATABASE_ENTITIES],
  migrations: ["src/database/migrations/*.ts"],
  synchronize: false,
});

export default AppDataSource;
