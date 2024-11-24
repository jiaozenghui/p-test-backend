import {
  Inject,
  HTTPController,
  HTTPMethod,
  HTTPMethodEnum,
  HTTPBody,
  EggQualifier,
  EggType,
  HTTPQuery,
} from "@eggjs/tegg";
import { IHelper, EggAppConfig } from "egg";
import { UserService } from "@/module/foo";
import { UserProps } from "app/model/user";
import inputValidate from "app/decorator/inputValidate";

const sendCodeRules = {
  phoneNumber: {
    type: "string",
    format: /^1[3-9]\d{9}$/,
    message: "手机号码格式错误",
  },
};
const userCreateRules = {
  username: "email",
  password: { type: "password", min: 8 },
};
@HTTPController({
  path: "/auth",
})
export class AuthController {
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
  @EggQualifier(EggType.APP)
  redis;
  @Inject()
  @EggQualifier(EggType.CONTEXT)
  EUtils;
  @HTTPMethod({
    method: HTTPMethodEnum.POST,
    path: "login",
  })
  @inputValidate(userCreateRules, "UserValidateFail")
  async loginByEmail(@HTTPBody() body) {
    const { username, password } = body;
    const user = await this.userService.findByUserName(username);
    if (!user) {
      return this.helper.error({ errorType: "loginCheckFailInfo" });
    }

    const verifyPwd = await this.bcryptEgg.compare(password, user.password);
    if (!verifyPwd) {
      return this.helper.error({ errorType: "loginCheckFailInfo" });
    }
    const token = this.jwt.sign(
      { username: user.username, _id: user._id },
      this.config.jwt.secret,
      {
        expiresIn: 60 * 60,
      }
    );
    this.helper.success({ res: { token, user }, msg: "登陆成功" });
  }

  @HTTPMethod({
    method: HTTPMethodEnum.POST,
    path: "loginByphone",
  })
  @inputValidate(sendCodeRules, "UserValidateFail")
  async loginByPhoneNumber(@HTTPBody() body) {
    const { phoneNumber, veriCode } = body;
    //验证码是否正确
    const preVeriCode = await this.redis.get(`phoneVeriCode-${phoneNumber}`);
    if (preVeriCode !== veriCode) {
      return this.helper.error({ errorType: "loginVeriCodeIncorrectFailInfo" });
    }
    const token = await this.userService.loginByCellPhone(phoneNumber);
    this.helper.success({ res: token });
  }

  @HTTPMethod({
    method: HTTPMethodEnum.POST,
    path: "getVeriCode",
  })
  @inputValidate(sendCodeRules, "UserValidateFail")
  async sendVeriCode(@HTTPBody() body) {
    const { phoneNumber } = body;

    //获取redis得数据
    //phoneVeriCode-13111111111
    const preVeriCode = await this.redis.get(`phoneVeriCode-${phoneNumber}`);
    //判断是否存在
    if (preVeriCode) {
      return this.helper.error({ errorType: "sendVeriCodeFrequentlyFailInfo" });
    }
    const veriCode = Math.floor(Math.random() * 9000 + 1000).toString();

    //发送短信
    //生产环境才会发送
    if (this.config.env === "prod") {
      const resp = await this.userService.sendSMS(phoneNumber, veriCode);
      if (resp && resp.body?.code !== "OK") {
        return this.helper.error({
          errorType: "sendVeriCodeError",
          error: resp,
        });
      }
    }

    await this.redis.set(`phoneVeriCode-${phoneNumber}`, veriCode, "ex", 60);

    this.helper.success({
      res: this.config.env === "local" ? { veriCode } : null,
    });
  }

  @HTTPMethod({
    method: HTTPMethodEnum.GET,
    path: "passport/gitee",
  })
  async authRedirect() {
    const { cid, redirectUrl } = this.config.giteeOauthConfig;

    this.EUtils.redirect(
      `https://gitee.com/oauth/authorize?client_id=${cid}&redirect_uri=${redirectUrl}&response_type=code`
    );
  }

  @HTTPMethod({
    method: HTTPMethodEnum.GET,
    path: "passport/gitee/callback",
  })
  async oauthByGitee(@HTTPQuery({ name: "code" }) code: string) {
    try {
      const token = await this.userService.loginByGitee(code);
      if (token) {
        console.log("test++++++++++++++");
        await this.EUtils.render("success.nj", { token });
        //this.helper.success({ res: { token } });
      }
    } catch (error) {
      console.log(error);
      return this.helper.error({ errorType: "giteeOauthError" });
    }
  }
}
