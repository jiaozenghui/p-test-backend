"use strict";
module.exports = () => {
  return async function (ctx, next) {
    try {
      await next();
    } catch (e) {
      const error = e as any;
      if (error && error.status === 401) {
        return ctx.helper.error({ errorType: "loginValidateFail" });
      } else if (ctx.path.startsWith("/api/utils/upload")) {
        if (error && error.status === 400) {
          return ctx.helper.error({
            errorType: "imageUploadFailFormatError",
            error: error.message,
          });
        }
      }
      throw e;
    }
  };
};
