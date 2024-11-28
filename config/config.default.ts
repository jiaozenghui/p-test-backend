import { EggAppConfig, EggAppInfo, PowerPartial } from "egg";
import "dotenv/config";
import { join } from "path";
export default (appInfo: EggAppInfo) => {
  const config = {} as PowerPartial<EggAppConfig>;
  // override config from framework / plugin
  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + "_1721285358314_7096";

  // add your egg config in here
  config.middleware = [];

  const aliCloudConfig = {
    accessKeyId: process.env.ALC_ACCESS_KEY,
    accessKeySecret: process.env.ALC_SECRET_KEY,
    endpoint: `dysmsapi.aliyuncs.com`,
  };
  const giteeOauthConfig = {
    cid: process.env.GITEE_CID,
    secret: process.env.GITEE_SECRET,
    redirectUrl: "http://localhost:7006/auth/passport/gitee/callback",
    authUrl: "https://gitee.com/oauth/token?grant_type=authorization_code",
    giteeUserAPI: "https://gitee.com/api/v5/user",
  };
  // add your special config in here
  const bizConfig = {
    //sourceUrl: `https://github.com/eggjs/examples/tree/master/${appInfo.name}`,
    cluster: {
      listen: {
        path: "",
        port: 7006,
      },
    },
    security: {
      xframe: {
        enable: true,
        // 'SAMEORIGIN', 'DENY' or 'ALLOW-FROM http://example.jp'
        value: "ALLOW-FROM http://localhost:8888",
      },
      csrf: {
        enable: false,
        ignoreJSON: true, // 默认为 false，当设置为 true 时，将会放过所有 content-type 为 `application/json` 的请求
      },
      domainWhiteList: ["*"],
    },
    cors: { allowMethods: "GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS" },
    //secret: '1234567890',
    aliCloudConfig,
    giteeOauthConfig,
    H5BaseURL: "http://localhost:7006/api/utils",
    baseUrl: "dist.url",
  };
  config.jwt = {
    enable: true,
    secret: process.env.JWT_SECRET || "",
    /*match(ctx) {
      const url = ctx.request.url;
      if (
        url.startsWith("/auth") ||
        url.startsWith("/uploads") ||
        url.startsWith("/public")
      ) {
        return false;
      } else {
        return true;
      }
    },*/

    ///^\/api\/articles/g
    ignore: ["/api/works/templist", "/auth/", "/api/utils/", "/api/users/create", '/api/articles/change', /^\/api\/articles\/(?!create|update).*/g],
  };
  //中间件自带通用项目设置
  //enable：控制中间件是否开启。
  //match：设置只有符合某些规则的请求才会经过这个中间件。
  //ignore：设置符合某些规则的请求不经过这个中间件。

  config.bcrypt = {
    saltRounds: 10, // default 10
  };
  config.mongoose = {
    url: "mongodb://user:pass@111.229.109.174:27017/egg",
  };
  config.view = {
    mapping: {
      ".ejs": "ejs",
      ".nj": "nunjucks",
    },
  };
  config.redis = {
    client: {
      port: 6379, // Redis port
      host: process.env.REDIS_HOST, // Redis host
      password: process.env.REDIS_PASSWORD,
      db: 0,
    },
  };
  /*config.multipart = {
    mode: "file",
    tmpdir: join(appInfo.baseDir, "uploads"),
  };*/
  config.multipart = {
    whitelist: [".png", ".jpg", ".gif", ".webp"],
    fileSize: "2048kb",
  };
  config.static = {
    dir: [
      { prefix: "/public", dir: join(appInfo.baseDir, "app/public") },
      { prefix: "/uploads", dir: join(appInfo.baseDir, "uploads") },
    ],
  };

  config.oss = {
    client: {
      accessKeyId: process.env.ALC_ACCESS_KEY || "",
      accessKeySecret: process.env.ALC_SECRET_KEY || "",
      endpoint: `oss-cn-beijing.aliyuncs.com`,
      bucket: "p-test-ui",
    },
  };
  // the return config will combines to EggAppConfig
  return {
    ...(config as {}),
    ...bizConfig,
  };
};
