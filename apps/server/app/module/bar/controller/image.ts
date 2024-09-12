import { EggLogger } from "egg";
import {
  Inject,
  HTTPController,
  HTTPMethod,
  HTTPMethodEnum,
} from "@eggjs/tegg";

@HTTPController({
  path: "/project/image",
})
export class ImageController {
  @Inject()
  logger: EggLogger;

  @HTTPMethod({
    method: HTTPMethodEnum.POST,
    path: "/upload",
  })
  async index() {
    return {
      sucess: true,
      data: {
        urls: ["test.url"],
      },
    };
  }
}
