import {
  Inject,
  HTTPController,
  HTTPMethod,
  HTTPMethodEnum,
  HTTPBody,
  EggQualifier,
  EggType,
  HTTPQuery,
  HTTPParam,
} from "@eggjs/tegg";
import { IHelper, EggAppConfig, MongooseModelrs } from "egg";
import { WorkService } from "@/module/foo";
import { WorkProps } from "app/model/work";
import inputValidate from "app/decorator/inputValidate";
import checkPermission from "app/decorator/checkPermission";
import { PopulateOptions } from "mongoose";
import { nanoid } from "nanoid";
import { count } from "console";

const workCreateRules = {
  title: "string",
};
const channelCreateRules = {
  name: "string",
};
export interface IndexCondition {
  pageIndex?: number;
  pageSize?: number;
  select?: string | string[];
  populate?: PopulateOptions | (string | PopulateOptions)[];
  customSort?: Record<string, any>;
  find?: Record<string, any>;
}

@HTTPController({
  path: "/api/works",
})
export class WorkController {
  @Inject()
  workService: WorkService;
  @Inject()
  validator;
  @Inject()
  @EggQualifier(EggType.CONTEXT)
  helper: IHelper;
  @Inject()
  @EggQualifier(EggType.CONTEXT)
  bcryptEgg;
  @Inject()
  config: EggAppConfig;
  @Inject()
  header;
  @Inject()
  @EggQualifier(EggType.CONTEXT)
  state;
  @Inject()
  @EggQualifier(EggType.APP)
  jwt;
  @Inject()
  model: MongooseModelrs;
  @Inject()
  @EggQualifier(EggType.CONTEXT)
  EUtils;
  @HTTPMethod({
    method: HTTPMethodEnum.POST,
    path: "create",
  })
  @inputValidate(workCreateRules, "workValidateFail")
  async createWork(@HTTPBody() body: WorkProps) {
    const workData = await this.workService.createEmptyWork(body);

    this.helper.success({ res: workData.toJSON() });
  }

  @HTTPMethod({
    method: HTTPMethodEnum.GET,
    path: "list",
  })
  async myList(
    @HTTPQuery({ name: "pageIndex" })
    pageIndex: number,
    @HTTPQuery({ name: "pageSize" })
    pageSize: number,
    @HTTPQuery({ name: "isTemplate" })
    isTemplate: boolean,
    @HTTPQuery({ name: "title" })
    title: string
  ) {
    const userId = this.state.user._id;
    const findCondition = {
      user: userId,
      ...(title && { title: { $regex: title, $options: "i" } }),
      ...(isTemplate && { isTemplate: isTemplate }),
    };

    const listCondition: IndexCondition = {
      select:
        "id author copiedCount coverImg desc title user isHot createdAt latestPublishAt status isTemplate channels",
      populate: { path: "user", select: "username nickName, picture" },
      find: findCondition,
      ...(pageIndex && { pageIndex: pageIndex }),
      ...(pageSize && { pageSize: pageSize }),
    };
    const res = await this.workService.getList(listCondition);
    this.helper.success({ res });
  }

  @HTTPMethod({
    method: HTTPMethodEnum.GET,
    path: "templist",
  })
  async tempList(
    @HTTPQuery({ name: "pageIndex" })
    pageIndex: number,
    @HTTPQuery({ name: "pageSize" })
    pageSize: number,
    @HTTPQuery({ name: "isTemplate" })
    isTemplate: boolean,
    @HTTPQuery({ name: "title" })
    title: string
  ) {
    const userId = this.state.user._id;
    const findCondition = {
      isPublic: true,
      isTemplate: true,
    };

    const listCondition: IndexCondition = {
      select:
        "id author copiedCount coverImg desc title user isHot createdAt latestPublishAt status isTemplate channels",
      populate: { path: "user", select: "username nickName, picture" },
      find: findCondition,
      ...(pageIndex && { pageIndex: pageIndex }),
      ...(pageSize && { pageSize: pageSize }),
    };
    const res = await this.workService.getList(listCondition);
    this.helper.success({ res });
  }

  @HTTPMethod({
    method: HTTPMethodEnum.PATCH,
    path: "update/:id",
  })
  @checkPermission("Work", "workNoPermissionFail")
  async updateWork(
    @HTTPParam({ name: "id" }) id: number,
    @HTTPBody() body: WorkProps
  ) {
    const res = await this.model.Work.findOneAndUpdate({ id }, body, {
      new: true,
    });
    this.helper.success({ res });
  }

  @HTTPMethod({
    method: HTTPMethodEnum.DELETE,
    path: "delete/:id",
  })
  @checkPermission("Work", "workNoPermissionFail")
  async deleteWork(@HTTPParam({ name: "id" }) id: number) {
    const res = await this.model.Work.findOneAndDelete({ id })
      .select("_id id title")
      .lean();
    this.helper.success({ res });
  }

  @HTTPMethod({
    method: HTTPMethodEnum.PATCH,
    path: "publish/:type/:id",
  })
  @checkPermission("Work", "workNoPermissionFail")
  async publish(
    @HTTPParam({ name: "id" }) id: number,
    @HTTPParam({ name: "type" }) type: string
  ) {
    //type==='template' 发布为模板
    const url = await this.workService.publish(id, type === "template");
    if (url) {
      this.helper.success({ res: { url } });
    } else {
      this.helper.error({ errorType: "workPublishFail" });
    }
  }

  @HTTPMethod({
    method: HTTPMethodEnum.POST,
    path: "channels",
  })
  @inputValidate(channelCreateRules, "workChannelValidateFail")
  async CreateChannel(@HTTPBody() body) {
    const { name, workId } = body;
    const newChannel = { name, id: nanoid(6) };
    const res = await this.model.Work.findOneAndUpdate(
      { id: workId },
      { $push: { channels: newChannel } }
    );
    if (res) {
      this.helper.success({ res: newChannel });
    } else {
      this.helper.error({ errorType: "channelOperateFail" });
    }
  }

  @HTTPMethod({
    method: HTTPMethodEnum.GET,
    path: "channels/:id",
  })
  async getWorkChannel(@HTTPParam({ name: "id" }) id: number) {
    const certainWork = await this.model.Work.findOne({ id });
    if (certainWork) {
      const { channels } = certainWork;
      this.helper.success({
        res: {
          count: (channels && channels.length) || 0,
          list: channels || [],
        },
      });
    } else {
      this.helper.error({ errorType: "channelOperateFail" });
    }
  }

  @HTTPMethod({
    method: HTTPMethodEnum.PATCH,
    path: "channels/update/:id",
  })
  async updateChannelName(
    @HTTPParam({ name: "id" }) id: number,
    @HTTPBody() body
  ) {
    const { name } = body;
    const res = await this.model.Work.findOneAndUpdate(
      { "channels.id": id },
      {
        $set: { "channels.$.name": name },
      }
    );

    this.helper.success({ res: { name } });
  }

  @HTTPMethod({
    method: HTTPMethodEnum.DELETE,
    path: "channels/delete/:id",
  })
  async deleteChannel(@HTTPParam({ name: "id" }) id: number) {
    const work = await this.model.Work.findByIdAndUpdate(
      { "channels.id": id },
      { $pull: { channels: { id } } },
      { new: true }
    );
    this.helper.success({ res: work });
  }
  async checkPermission(id: number) {
    const userId = this.state.user_id;

    const certainWork = await this.model.Work.findOne({ id });
    if (!certainWork) {
      return false;
    }
    return certainWork.user.toString() === userId;
  }
}
