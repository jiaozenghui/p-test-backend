import { Application } from "egg";
import { ObjectId, Document } from "mongoose";
const AutoIncrementFactory = require("mongoose-sequence");
export interface ArticleProps {
  id?: number;
  uuid: string;
  title: string;
  desc: string;
  coverImg?: string;
  content?: string;
  isPublic?: boolean;
  isHot?: boolean;
  author: string;
  copiedCount: number;
  status?: 0 | 1 | 2;
  user: ObjectId;
  latestPublishAt: Date;
  likeCount: number;
  viewCount:number;
  category: string
}


export default (app: Application) => {
  const AutoIncrement = AutoIncrementFactory(app.mongoose);
  const mongoose = app.mongoose;
  const Schema = mongoose.Schema;
  const ArticleSchema = new Schema<ArticleProps & Document<any, any, ArticleProps>>(
    {
      uuid: { type: String, unique: true },
      title: { type: String },
      desc: { type: String },
      coverImg: { type: String },
      content: { type: Object },
      isPublic: {
        type: Boolean,
        default: true
      },
      isHot: { type: Boolean },
      author: { type: String },
      copiedCount: { type: Number, default: 0 },
      likeCount: { type: Number, default: 0 },
      viewCount: { type: Number, default: 0 },
      status: { type: Number, default: 0 },
      user: { type: Schema.Types.ObjectId, ref: "User" },
      latestPublishAt: { type: Date },
      category: {type: String}
    },
    {
      timestamps: true,
    }
  );
  ArticleSchema.plugin(AutoIncrement, { inc_field: "id", id: "articles_id_counter" });
  return mongoose.model<ArticleProps>("Article", ArticleSchema);
};
