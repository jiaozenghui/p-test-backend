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
import { PageService } from "@/module/foo";
import { PageProps } from "app/model/page";
import { PopulateOptions } from "mongoose";
import { nanoid } from "nanoid";

const pageCreateRules = {
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
  path: "/api/pages",
})
export class PageController {
  @Inject()
  pageService: PageService;
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
  async createPage(@HTTPBody() body: PageProps) {
    const pageData = await this.pageService.createEmptyPage(body);

    this.helper.success({ res: pageData.toJSON() });
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
    @HTTPQuery({ name: "pType" })
    pType: boolean,
    @HTTPQuery({ name: "title" })
    title: string
  ) {
    const findCondition = {
      ...(title && { title: { $regex: title, $options: "i" } }),
      ...(pType && { pType: pType }),
    };

    const listCondition: IndexCondition = {
      select:
        "id uuid author copiedCount coverImg content desc layouts title user isHot createdAt latestPublishAt status isTemplate channels",
      populate: { path: "user", select: "username nickName, picture" },
      find: findCondition,
      ...(pageIndex && { pageIndex: pageIndex }),
      ...(pageSize && { pageSize: pageSize }),
    };
    const res = await this.pageService.getList(listCondition);
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
    const findCondition = {
      // isPublic: true,
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
    const res = await this.pageService.getList(listCondition);
    this.helper.success({ res });
  }

  @HTTPMethod({
    method: HTTPMethodEnum.PATCH,
    path: "update/:id",
  })
  async updatePage(
    @HTTPParam({ name: "id" }) id: number,
    @HTTPBody() body: PageProps
  ) {
    const res = await this.model.Page.findOneAndUpdate({ id }, body, {
      new: true,
    });
    this.helper.success({ res });
  }

  @HTTPMethod({
    method: HTTPMethodEnum.GET,
    path: ":id",
  })
  async getPage(@HTTPParam({ name: "id" }) id: number) {
    const res = await this.model.Page.findOne({ id });
    this.helper.success({ res });
  }

  @HTTPMethod({
    method: HTTPMethodEnum.DELETE,
    path: "delete/:id",
  })
  async deletePage(@HTTPParam({ name: "id" }) id: number) {
    const res = await this.model.Page.findOneAndDelete({ id })
      .select("_id id title")
      .lean();
    this.helper.success({ res });
  }


  @HTTPMethod({
    method: HTTPMethodEnum.POST,
    path: "channels",
  })
  async CreateChannel(@HTTPBody() body) {
    const { name, pageId } = body;
    const newChannel = { name, id: nanoid(6) };
    const res = await this.model.Page.findOneAndUpdate(
      { id: pageId },
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
  async getPageChannel(@HTTPParam({ name: "id" }) id: number) {
    const certainPage = await this.model.Page.findOne({ id });
    if (certainPage) {
      const { channels } = certainPage;
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
    const page = await this.model.Page.findOneAndUpdate(
      { "channels.id": id },
      {
        $set: { "channels.$.name": name },
      }
    );

    if (page) {
      this.helper.success({ res: page });
    } else {
      this.helper.error({ errorType: "channelOperateFail" });
    }
  }

  @HTTPMethod({
    method: HTTPMethodEnum.DELETE,
    path: "channels/delete/:id",
  })
  async deleteChannel(@HTTPParam({ name: "id" }) id: number) {
    const page = await this.model.Page.findOneAndUpdate(
      { "channels.id": id },
      { $pull: { channels: { id } } },
      { new: true }
    );
    if (page) {
      this.helper.success({ res: page });
    } else {
      this.helper.error({ errorType: "channelOperateFail" });
    }
  }
  async checkPermission(id: number) {
    const userId = this.state.user_id;

    const certainPage = await this.model.Page.findOne({ id });
    if (!certainPage) {
      return false;
    }
    return certainPage.user.toString() === userId;
  }
}
