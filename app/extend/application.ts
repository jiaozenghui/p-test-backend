import { Application } from "egg";
import Dysmsapi20170525 from '@alicloud/dysmsapi20170525';
import  * as $OpenApi from '@alicloud/openapi-client';


const ALICLIENT = Symbol('Application#ALClient')

module.exports = {
    get ALClient():Dysmsapi20170525 {
        const that = this as Application;
        const {accessKeyId,accessKeySecret, endpoint} = that.config.aliCloudConfig
        let config = new $OpenApi.Config({
            accessKeyId: accessKeyId,
            accessKeySecret:accessKeySecret,
          });
          config.endpoint = endpoint;
          this[ALICLIENT] = new Dysmsapi20170525(config)
          return this[ALICLIENT]
    }
}