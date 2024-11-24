import { UserErrorMessages } from "./user";
import { WorkErrorMessages } from "./work";
import { UtilsErrorMessages } from "./utils";
import { ArticleErrorMessages } from "./article";

export const globalErrorMessages = {
  ...UserErrorMessages,
  ...WorkErrorMessages,
  ...UtilsErrorMessages,
  ...ArticleErrorMessages
};

export type GlobalErrorTypes = keyof typeof globalErrorMessages;

export interface RespType {
  res?: any;
  msg?: string;
}
export interface ErrorRespType {
  errorType: GlobalErrorTypes;
  msg?: string;
  error?: any;
}
declare module "egg" {
  interface IHelper {
    success({ res, msg }: RespType): any;
    error({ errorType, error }: ErrorRespType): any;
  }
}
