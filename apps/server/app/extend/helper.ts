import { RespType, ErrorRespType, globalErrorMessages } from "../error";

module.exports = {
  success({ res, msg }: RespType) {
    this.ctx.body = {
      errno: 0,
      data: res ? res : null,
      message: msg ? msg : "请求成功",
    };
    this.ctx.status = 200;
  },
  error({ errorType, error }: ErrorRespType) {
    const { message, errno } = globalErrorMessages[errorType];
    this.ctx.body = {
      errno,
      message,
      ...(error && { error }),
    };
    this.ctx.status = 200;
  },
};
