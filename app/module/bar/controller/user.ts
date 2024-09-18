import {
  Inject,
  HTTPController,
  HTTPMethod,
  HTTPMethodEnum,
  HTTPBody,
  HTTPParam,
  EggQualifier,
  EggType,
} from "@eggjs/tegg";
import { IHelper, EggAppConfig } from "egg";
import { UserService } from "@/module/foo";
import { UserProps } from "app/model/user";
import inputValidate from "app/decorator/inputValidate";
const userCreateRules = {
  username: "email",
  password: { type: "password", min: 8 },
};

@HTTPController({
  path: "/api/users",
})
export class UserController {
  @Inject()
  userService: UserService;
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
  @EggQualifier(EggType.CONTEXT)
  EUtils;
  @HTTPMethod({
    method: HTTPMethodEnum.POST,
    path: "create",
  })
  @inputValidate(userCreateRules, "UserValidateFail")
  async createByEmail(@HTTPBody() body: UserProps) {
    const { username } = body;
    const user = await this.userService.findByUserName(username);
    if (user) {
      return this.helper.error({ errorType: "createUserAlreadyExists" });
    }

    const userData = await this.userService.createByEmail(body);

    this.helper.success({ res: userData.toJSON() });
  }

  @HTTPMethod({
    method: HTTPMethodEnum.GET,
    path: ":id",
  })
  async list(@HTTPParam({ name: "id" }) id: string) {
    const userData = await this.userService.findById(id);
    return userData;
  }

  @HTTPMethod({
    method: HTTPMethodEnum.GET,
    path: "current",
  })
  async show() {
    const userData = await this.userService.findByUserName(
      this.state.user.username
    );
    this.helper.success({ res: userData?.toJSON() });
  }

  validateUserInput(body: UserProps) {
    const errors = this.validator.validate(userCreateRules, body);
    return errors;
  }
}
