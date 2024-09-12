import "egg-mongoose";
import "egg-validate";
import "egg-jwt";
import "egg-redis";
import * as OSS from "ali-oss";
import { Options } from "ali-oss";
import { EggPluginItem, MongooseModelrs, Context } from "egg";

declare module "egg" {
  interface EggPlugin {
    mongoose?: EggPluginItem;
    validator?: EggPluginItem;
  }
  interface Context {
    oss: OSS;
  }
  interface Controller {
    EUtils: {
      ctx: Context;
    };
  }
  interface MongooseModelrs extends IModel {
    [key: string]: (typeof MongooseModels)[key];
  }
  interface EggAppConfig {
    bcrypt: {
      saltRounds: number;
    };
    oss: { client?: Options };
  }
}
