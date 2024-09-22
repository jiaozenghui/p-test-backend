import { EggLogger } from "egg";
import { version as appVersion } from "../../../../package.json";
import {
  Inject,
  HTTPController,
  HTTPMethod,
  HTTPMethodEnum,
  EggQualifier,
  EggType,
} from "@eggjs/tegg";

@HTTPController({
  path: "/ping",
})
export class HomeController {
  @Inject()
  logger: EggLogger;
  @Inject()
  @EggQualifier(EggType.CONTEXT)
  EUtils;
  @HTTPMethod({
    method: HTTPMethodEnum.GET,
    path: "info",
  })
  async index() {
    const { status } = this.EUtils.ctx.app.redis;
    const { version } =
      await this.EUtils.ctx.app.mongoose.connection.db.command({
        buildInfo: 1,
      });

    this.EUtils.ctx.helper.success({
      res: {
        dbVersion: version,
        resdisStatus: status,
        appVersion,
        env: process.env.PING_ENV,
      },
    });
  }
}
