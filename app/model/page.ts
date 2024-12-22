import { Application } from "egg";
import { ObjectId, Document } from "mongoose";
const AutoIncrementFactory = require("mongoose-sequence");
export interface PageProps {
  id?: number;
  uuid: string;
  title: string;
  desc: string;
  coverImg?: string;
  content?: { [key: string]: any };
  isTemplate?: boolean;
  isPublic?: boolean;
  isHot?: boolean;
  author: string;
  copiedCount: number;
  status?: 0 | 1 | 2;
  user: ObjectId;
  latestPublishAt: Date;
  channels?: ChannelProps[];
  pType: 1 | 2 | 3;
}

export interface ChannelProps {
  name: string;
  id: string;
}
export default (app: Application) => {
  const AutoIncrement = AutoIncrementFactory(app.mongoose);
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  const PageSchema = new Schema<PageProps & Document<any, any, PageProps>>(
    {
      uuid: { type: String, unique: true },
      title: { type: String },
      desc: { type: String },
      coverImg: { type: String },
      content: { type: Object },
      isTemplate: {
        type: Boolean,
      },
      isPublic: {
        type: Boolean,
      },
      isHot: { type: Boolean },
      author: { type: String },
      copiedCount: { type: Number, default: 0 },
      status: { type: Number, default: 0 },
      user: { type: Schema.Types.ObjectId, ref: "User" },
      latestPublishAt: { type: Date },
      channels: { type: Array },
      pType: {
        type: Number,
        default: 1,
      },
    },
    {
      timestamps: true,
    }
  );
  PageSchema.plugin(AutoIncrement, { inc_field: "id", id: "pages_id_counter" });
  return mongoose.model<PageProps>("Page", PageSchema);
};
