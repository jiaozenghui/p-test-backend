import { GlobalErrorTypes } from "../error";
import { Controller } from "egg";

export default function validateInput(rules: any, errorType: GlobalErrorTypes) {
  return function (prototype, key: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const that = this as Controller;
      //@ts-ignore
      const { helper, validator } = that;

      const errors = validator.validate(rules, args[0]);

      if (errors) {
        return helper.error({ errorType, error: errors });
      }
      return originalMethod.apply(this, args);
    };
  };
}
