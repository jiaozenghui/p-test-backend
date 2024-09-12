import { GlobalErrorTypes } from "../error";
import { Controller } from "egg";
import defineRoles from "../roles/roles";
import { subject } from "@casl/ability";

const caslMethodMapping: Record<string, string> = {
  GET: "read",
  POST: "create",
  PATCH: "update",
  DELETE: "delete",
};
export default function validateInput(
  modelName: string,
  errorType: GlobalErrorTypes,
  userKey = "user"
) {
  return function (prototype, key: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const that = this as Controller;

      //@ts-ignore
      const { helper, state, model, EUtils } = that;
      const { id } = EUtils.ctx.params;
      const { method } = EUtils.ctx.request;

      const action = caslMethodMapping[method];
      if (!state && !state.user) {
        return helper.error({ errorType });
      }

      let permission = false;

      //获取定义的roles
      const ability = defineRoles(state.user);
      //所以我们需要闲获取rule来判断一下，看他是否存在对应的条件
      const rule = ability.relevantRuleFor(action, modelName);
      if (rule && rule.conditions) {
        //假如存在 condition,先查询对应的数据
        const certainRecord = await model[modelName].findOne({ id }).lean();
        if (!certainRecord) {
          return helper.error({ errorType: "resourceNotFound" });
        }
        permission = ability.can(action, subject(modelName, certainRecord));
      } else {
        permission = ability.can(action, modelName);
      }
      if (!permission) {
        return helper.error({ errorType });
      }

      await originalMethod.apply(this, args);
    };
  };
}
