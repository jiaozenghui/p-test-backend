import { EggLogger, MongooseModelrs, EggAppConfig, EggHttpClient } from "egg";
import Dysmsapi20170525, * as $Dysmsapi20170525 from "@alicloud/dysmsapi20170525";
import {
  SingletonProto,
  AccessLevel,
  Inject,
  EggQualifier,
  EggType,
} from "@eggjs/tegg";
import { UserProps } from "app/model/user";

interface giteeUserResp {
  id: number;
  login: string;
  name: string;
  avatar_url: string;
  email: string;
}

@SingletonProto({
  // 如果需要在上层使用，需要把 accessLevel 显示声明为 public
  accessLevel: AccessLevel.PUBLIC,
})
export class UserService {
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
  ALClient: Dysmsapi20170525;
  @Inject()
  @EggQualifier(EggType.CONTEXT)
  httpclient: EggHttpClient;
  public async createByEmail(payload: UserProps) {
    const { username, password } = payload;
    const hash = await this.bcryptEgg.genHash(password);
    const userCreatedData: Partial<UserProps> = {
      username,
      password: hash,
      email: username,
    };
    return this.model.User.create(userCreatedData);
  }
  async findById(id: string) {
    const result = await this.model.User.findById(id);
    return result;
  }
  async findByUserName(username: string) {
    return this.model.User.findOne({ username });
  }

  async loginByCellPhone(cellphone: string) {
    const user = await this.findByUserName(cellphone);
    if (user) {
      const token = this.jwt.sign(
        { username: user.username, _id: user._id },
        this.config.jwt.secret
      );
      return token;
    }
    //新建一个用户
    const userCreatedData: Partial<UserProps> = {
      username: cellphone,
      phoneNumber: cellphone,
      nickName: `p-test${cellphone.slice(-4)}`,
      type: "cellphone",
    };
    const newUser = await this.model.User.create(userCreatedData);
    const token = this.jwt.sign(
      { username: newUser.username, _id: newUser._id },
      this.config.jwt.secret
    );
    return token;
  }

  async sendSMS(phoneNumber: string, veriCode: string) {
    const sendSmsRequest = new $Dysmsapi20170525.SendSmsRequest({
      signName: "阿里云短信测试",
      templateCode: "SMS_154950909",
      phoneNumbers: phoneNumber,
      templateParam: `{\"code\":\"${veriCode}\"}`,
    });
    const resp = await this.ALClient.sendSms(sendSmsRequest);
    return resp;
  }
  async getAcessToken(code: string) {
    const { cid, secret, redirectUrl, authUrl } = this.config.giteeOauthConfig;
    const { data } = await this.httpclient.curl(authUrl, {
      method: "POST",
      contentType: "json",
      dataType: "json",
      data: {
        code,
        client_id: cid,
        redirect_uri: redirectUrl,
        client_secret: secret,
      },
    });
    return data.access_token;
  }
  async getGiteeUserData(access_token: string) {
    const { giteeUserAPI } = this.config.giteeOauthConfig;
    const { data } = await this.httpclient.curl<giteeUserResp>(
      `${giteeUserAPI}?access_token=${access_token}`,
      {
        dataType: "json",
      }
    );
    return data;
  }
  async loginByGitee(code: string) {
    const accessToken = await this.getAcessToken(code);
    const user = await this.getGiteeUserData(accessToken);
    //检查用户信息是否存在
    const { id, name, avatar_url, email } = user;
    const stringId = id.toString();
    const existUser = await this.findByUserName(`Gitee${stringId}`);
    if (existUser) {
      const token = this.jwt.sign(
        { username: existUser.username, _id: existUser._id },
        this.config.jwt.secret
      );
      return token;
    }

    //假如用户不存在
    const userCreatedData: Partial<UserProps> = {
      oauthID: stringId,
      provider: "gitee",
      username: `Gitee${stringId}`,
      picture: avatar_url,
      nickName: name,
      email,
      type: "oauth",
    };
    const newUser = await this.model.User.create(userCreatedData);
    const token = this.jwt.sign(
      { username: newUser.username, _id: newUser._id },
      this.config.jwt.secret
    );
    return token;
  }
}
