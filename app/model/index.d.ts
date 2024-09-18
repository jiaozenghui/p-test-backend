import "egg";
import ExportUser from "./user";
import ExportWork from "./work";
import * as mongoose from "mongoose";
declare module "egg" {
  interface IModel {
    User: ReturnType<typeof ExportUser>;
    Work: ReturnType<typeof ExportWork>;
  }
}
