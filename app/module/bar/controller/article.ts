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
import { ArticleService } from "@/module/foo";
import { ArticleProps } from "app/model/article";
import inputValidate from "app/decorator/inputValidate";
import checkPermission from "app/decorator/checkPermission";
import { PopulateOptions } from "mongoose";
import { nanoid } from "nanoid";

const articleCreateRules = {
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
  path: "/api/articles",
})
export class ArticleController {
  @Inject()
  articleService: ArticleService;
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
  @inputValidate(articleCreateRules, "articleValidateFail")
  async createArticle(@HTTPBody() body: ArticleProps) {
    const articleData = await this.articleService.createEmptyArticle(body);

    this.helper.success({ res: articleData.toJSON() });
  }

  @HTTPMethod({
    method: HTTPMethodEnum.POST,
    path: "copy/:id",
  })
  @checkPermission("Article", "articleNoPermissionFail")
  async copyArticle(@HTTPParam({ name: "id" }) id: number) {
    const articleData = await this.articleService.copyArticle(id);
    if (articleData) {
      this.helper.success({ res: articleData.toJSON() });
    } else {
      this.helper.error({ errorType: "articleCopyFail" });
    }
  }

  @HTTPMethod({
    method: HTTPMethodEnum.GET,
    path: "lists",
  })
  async myList(
    @HTTPQuery({ name: "pageIndex" })
    pageIndex: number,
    @HTTPQuery({ name: "pageSize" })
    pageSize: number,
    @HTTPQuery({ name: "isPublic" })
    isPublic: boolean,
    @HTTPQuery({ name: "title" })
    title: string
  ) {
    const userId = this.state.user._id;
    const findCondition = {
      user: userId,
      ...(title && { title: { $regex: title, $options: "i" } }),
      ...(isPublic && { isPublic: isPublic }),
    };

    const listCondition: IndexCondition = {
      select:
        "id uuid author copiedCount coverImg desc title user isHot createdAt latestPublishAt status",
      populate: { path: "user", select: "username nickName, picture" },
      find: findCondition,
      ...(pageIndex && { pageIndex: pageIndex }),
      ...(pageSize && { pageSize: pageSize }),
    };
    const res = await this.articleService.getList(listCondition);
    this.helper.success({ res });
  }

  @HTTPMethod({
    method: HTTPMethodEnum.GET,
    path: "list",
  })
  async tempList(
    @HTTPQuery({ name: "pageIndex" })
    pageIndex: number,
    @HTTPQuery({ name: "pageSize" })
    pageSize: number,
    @HTTPQuery({ name: "isPublic" })
    isPublic: boolean,
    @HTTPQuery({ name: "title" })
    title: string
  ) {
    const findCondition = {
      // isPublic: true,
      isPublic: true,
    };

    const listCondition: IndexCondition = {
      select:
        "id author copiedCount coverImg desc title user isHot createdAt latestPublishAt status isPublic channels",
      populate: { path: "user", select: "username nickName, picture" },
      find: findCondition,
      ...(pageIndex && { pageIndex: pageIndex }),
      ...(pageSize && { pageSize: pageSize }),
    };
    const res = await this.articleService.getList(listCondition);
    this.helper.success({ res });
  }

  @HTTPMethod({
    method: HTTPMethodEnum.PATCH,
    path: "update/:id",
  })
  @checkPermission("Article", "articleNoPermissionFail")
  async updateArticle(
    @HTTPParam({ name: "id" }) id: number,
    @HTTPBody() body: ArticleProps
  ) {
    const res = await this.model.Article.findOneAndUpdate({ id }, body, {
      new: true,
    });
    this.helper.success({ res });
  }

  @HTTPMethod({
    method: HTTPMethodEnum.GET,
    path: ":id",
  })
  // @checkPermission("Article", "articleNoPermissionFail")
  async getArticle(@HTTPParam({ name: "id" }) id: number) {
    const res = await this.model.Article.findOne({ id });
    this.helper.success({ res });
  }

  @HTTPMethod({
    method: HTTPMethodEnum.DELETE,
    path: "delete/:id",
  })
  @checkPermission("Article", "articleNoPermissionFail")
  async deleteArticle(@HTTPParam({ name: "id" }) id: number) {
    const res = await this.model.Article.findOneAndDelete({ id })
      .select("_id id title")
      .lean();
    this.helper.success({ res });
  }

  @HTTPMethod({
    method: HTTPMethodEnum.PATCH,
    path: "publish/:type/:id",
  })
  @checkPermission("Article", "articleNoPermissionFail")
  async publish(
    @HTTPParam({ name: "id" }) id: number,
    @HTTPParam({ name: "type" }) type: string
  ) {
    //type==='template' 发布为模板
    const url = await this.articleService.publish(id, type === "template");
    if (url) {
      this.helper.success({ res: { url } });
    } else {
      this.helper.error({ errorType: "articlePublishFail" });
    }
  }

  async checkPermission(id: number) {
    const userId = this.state.user_id;

    const certainArticle = await this.model.Article.findOne({ id });
    if (!certainArticle) {
      return false;
    }
    return certainArticle.user.toString() === userId;
  }
}
