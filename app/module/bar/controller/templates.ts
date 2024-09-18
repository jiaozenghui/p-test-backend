import { EggLogger } from "egg";
import {
  Inject,
  HTTPController,
  HTTPMethod,
  HTTPMethodEnum,
} from "@eggjs/tegg";
//import mongo from "@/utils/mongo";

@HTTPController({
  path: "/project",
})
export class TemplateController {
  @Inject()
  logger: EggLogger;

  @HTTPMethod({
    method: HTTPMethodEnum.GET,
    path: "/templates",
  })
  async index() {
    //const data = await mongo().serch("templates");

    return [];
  }
}
