import { EggAppConfig, PowerPartial } from "egg";
import "dotenv/config";
export default () => {
  const config: PowerPartial<EggAppConfig> = {};
  config.mongoose = {
    url: "mongodb://p-test-mongo:27017/egg",
    options: {
      user: process.env.MONGO_DB_USERNAME,
      pass: process.env.MONGO_DB_PASSWORD,
    },
  };
  config.redis = {
    client: {
      port: 6379,
      host: "p-test-redis",
      password: process.env.REDIS_PASSWORD,
    },
  };
  return config;
};
