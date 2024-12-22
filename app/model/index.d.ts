import "egg";
import ExportUser from "./user";
import ExportWork from "./work";
import ExportArticle from "./article";
import ExportPage from "./page";
import * as mongoose from "mongoose";
declare module "egg" {
  interface IModel {
    User: ReturnType<typeof ExportUser>;
    Work: ReturnType<typeof ExportWork>;
    Article: ReturnType<typeof ExportArticle>;
    Page: ReturnType<typeof ExportPage>
  }
}
