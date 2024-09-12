import { IBoot, Application } from "egg";

export default class AppBoot implements IBoot {
  private readonly app: Application;
  constructor(app: Application) {
    this.app = app;
    /*const { url } = this.app.config.mongoose;
    assert(url, "[egg-mongose] url is reqired on config");
    const db = createConnection(url);
    db.on("connected", () => {
      app.logger.info(`[egg-mongose] ${url} connected successfully`);
    });
    app.mongoose = db;*/
  }

  configWillLoad() {
    this.app.config.coreMiddleware.push("customError");
  }
  async willReady() {}
}
