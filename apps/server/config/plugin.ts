import { EggPlugin } from "egg";

const plugin: EggPlugin = {
  tegg: {
    enable: true,
    package: "@eggjs/tegg-plugin",
  },
  teggConfig: {
    enable: true,
    package: "@eggjs/tegg-config",
  },
  teggController: {
    enable: true,
    package: "@eggjs/tegg-controller-plugin",
  },
  teggSchedule: {
    enable: true,
    package: "@eggjs/tegg-schedule-plugin",
  },
  eventbusModule: {
    enable: true,
    package: "@eggjs/tegg-eventbus-plugin",
  },
  aopModule: {
    enable: true,
    package: "@eggjs/tegg-aop-plugin",
  },
  tracer: {
    enable: true,
    package: "egg-tracer",
  },
  cors: {
    enable: true,
    package: "egg-cors",
  },
  mongoose: {
    enable: true,
    package: "egg-mongoose",
  },
  validate: {
    enable: true,
    package: "egg-validate",
  },
  bcrypt: {
    enable: true,
    package: "egg-bcrypt",
  },
  jwt: {
    enable: true,
    package: "egg-jwt",
  },
  redis: {
    enable: true,
    package: "egg-redis",
  },
  nunjucks: {
    enable: true,
    package: "egg-view-nunjucks",
  },
  oss: {
    enable: true,
    package: "egg-oss",
  },
};

export default plugin;
