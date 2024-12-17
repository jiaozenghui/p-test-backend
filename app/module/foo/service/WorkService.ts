import { EggLogger, MongooseModelrs, EggAppConfig, EggHttpClient } from "egg";

import { Types } from "mongoose";
import { IndexCondition } from "app/module/bar/controller/work";
import {
  SingletonProto,
  AccessLevel,
  Inject,
  EggQualifier,
  EggType,
} from "@eggjs/tegg";
import { WorkProps } from "app/model/work";
import { nanoid } from "nanoid";
import { createSSRApp } from "vue";
import { renderToString, renderToNodeStream } from "vue/server-renderer";
import PTestComp from "p-test-comp";
const defaultIndexCondition: Required<IndexCondition> = {
  pageIndex: 0,
  pageSize: 10,
  select: "",
  populate: { path: "" },
  customSort: { latestPublishAt: -1 },
  find: {},
};

@SingletonProto({
  // 如果需要在上层使用，需要把 accessLevel 显示声明为 public
  accessLevel: AccessLevel.PUBLIC,
})
export class WorkService {
  // 注入一个 logger
  @Inject()
  logger: EggLogger;
  @Inject()
  model: MongooseModelrs;
  @Inject()
  @EggQualifier(EggType.CONTEXT)
  bcryptEgg;
  @Inject()
  @EggQualifier(EggType.APP)
  jwt;
  @Inject()
  config: EggAppConfig;
  @Inject()
  @EggQualifier(EggType.CONTEXT)
  httpclient: EggHttpClient;
  @Inject()
  @EggQualifier(EggType.CONTEXT)
  state;
  public async createEmptyWork(payload) {
    const { username, _id } = this.state.user;
    const uuid = nanoid(6);
    const newEmptyWork: Partial<WorkProps> = {
      ...payload,
      user: new Types.ObjectId(_id),
      author: username,
      uuid,
    };
    return this.model.Work.create(newEmptyWork);
  }
  public async copyWork(id) {
    const work = await this.model.Work.findOne({ id });
    if (!work) {
      throw new Error("work not exists");
    }
    const { content } = work;

    // 新项目的信息，要符合 WorksModel 属性规则
    const newData = {
      title: `${work.title}-复制`,
      desc: work.desc,
      coverImg: work.coverImg,
    };
    const res = await this.createEmptyWork(newData);

    await this.model.Work.findOneAndUpdate(
      { id },
      { copiedCount: work.copiedCount + 1 },
      {
        new: true,
      }
    );

    return res;
  }
  async getList(condition: IndexCondition) {
    const fcondition = { ...defaultIndexCondition, ...condition };
    const { pageIndex, pageSize, select, populate, customSort, find } =
      fcondition;
    const skip = pageIndex * pageSize;
    const res = await this.model.Work.find(find)
      .select(select)
      .populate(populate)
      .skip(skip)
      .limit(pageSize)
      .sort(customSort)
      .lean();
    const count = await this.model.Work.find(find).countDocuments();
    return { count, list: res, pageIndex, pageSize };
  }

  async publish(id: number, isTemplate = false) {
    const { H5BaseURL } = this.config;
    const payload: Partial<WorkProps> = {
      status: 2,
      latestPublishAt: new Date(),
      ...(isTemplate && { isTemplate: true }),
    };
    const res = await this.model.Work.findOneAndUpdate({ id }, payload, {
      new: true,
    });
    if (res) {
      return `${H5BaseURL}/p/${id}-${res.uuid}`;
    }
    return null;
  }

  async renderToPageData(query: { id: string; uuid: string }) {
    const work = await this.model.Work.findOne(query).lean();
    if (!work) {
      throw new Error("work not exists");
    }
    const { title, desc, content } = work;
    this.px2vw(content && content.components);
    const vueApp = createSSRApp({
      data: () => {
        return { components: content && content.components };
      },
      template: `<final-page  :components="components"></final-page>`,
    });
    vueApp.use(PTestComp);
    const html = await renderToString(vueApp);
    const bodyStyle = this.propsToStyle(content && content.props);
    return {
      html,
      title,
      desc,
      bodyStyle,
    };
  }
  propsToStyle(props = {}) {
    const keys = Object.keys(props);
    const styleArr = keys.map((key) => {
      const formatKey = key.replace(
        /[A-Z]/g,
        (c) => `-${c.toLocaleLowerCase()}`
      );
      // fontSize->font-size
      const value = props[key];
      return `${formatKey}: ${value}`;
    });
    return styleArr.join(";");
  }
  px2vw(components = []) {
    const reg = /^(\d+(\.\d+)?)px$/;
    components.forEach((component: any = {}) => {
      const props = component.props || {};
      Object.keys(props).forEach((key) => {
        const val = props[key];
        if (typeof val !== "string") {
          return;
        }
        //value 中没有px， 不是一个距离的属性
        if (reg.test(val) === false) {
          return;
        }
        const arr = val.match(reg) || [];
        const numStr = arr[1];
        const num = parseFloat(numStr);
        //计算出vm,重新赋值
        //编辑器的画布宽度是 375
        const vmNum = (num / 375) * 100;
        props[key] = `${vmNum.toFixed(2)}vw`;
      });
    });
  }
}
