import { EggLogger, IHelper, EggAppConfig, FileStream } from "egg";
import path, { join, parse, extname } from "path";
import sharp, { strategy } from "sharp";
import { nanoid } from "nanoid";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import sendToWormhole from "stream-wormhole";

import { WorkService } from "@/module/foo";
import {
  Inject,
  HTTPController,
  HTTPMethod,
  HTTPMethodEnum,
  EggQualifier,
  EggType,
  HTTPParam,
} from "@eggjs/tegg";

const Busboy = require("busboy");

@HTTPController({
  path: "/api/utils",
})
export class UtilsController {
  @Inject()
  workService: WorkService;
  @Inject()
  logger: EggLogger;
  @Inject()
  @EggQualifier(EggType.CONTEXT)
  EUtils;
  @Inject()
  @EggQualifier(EggType.CONTEXT)
  helper: IHelper;
  @Inject()
  config: EggAppConfig;

  @HTTPMethod({
    method: HTTPMethodEnum.GET,
    path: "p/:idAndUuid",
  })
  async renderH5Page(@HTTPParam({ name: "idAndUuid" }) idAndUuid: string) {
    //ssr render basic demo
    /*     const vueApp = createSSRApp({
      data: () => ({
        msg: "hello world",
      }),
      template: "<h1>{{msg}}</h1>",
    }); */
    //const appContent = await renderToString(vueApp);
    //return appContent;
    /*    const stream = renderToNodeStream(vueApp);
    return await pipeline(stream, this.EUtils.ctx.res); */

    const query = this.splitIdAndUuid(idAndUuid);
    try {
      const pageData = await this.workService.renderToPageData(query);

      return this.EUtils.ctx.render("page.nj", pageData);
    } catch (error) {
      this.helper.error({ errorType: "h5WorkNotExistError" });
    }
  }

  @HTTPMethod({
    method: HTTPMethodEnum.POST,
    path: "/upload",
  })
  async fileLocalUpload() {
    const { filepath } = this.EUtils.ctx.request.files[0];

    //生成sharp 实例
    const imageSource = sharp(filepath);
    const metaData = await imageSource.metadata();
    this.logger.debug(metaData);
    let thumbnailUrl = "";
    //检查图片宽度是否大于300
    if (metaData.width && metaData.width > 300) {
      //generate a new file path
      // /uploads/**/abc.png ==> /uploads/**/abc-thumbnail.png
      const { name, ext, dir } = parse(filepath);
      this.logger.debug(name, ext, dir);
      const thumbnailFilePath = join(dir, `${name}-thumbnail${ext}`);

      await imageSource.resize({ width: 300 }).toFile(thumbnailFilePath);
      thumbnailUrl = thumbnailFilePath
        .replace(this.config.baseDir, this.config.baseUrl)
        .split(path.sep)
        .join("/");
    }
    const url = filepath
      .replace(this.config.baseDir, this.config.baseUrl)
      .split(path.sep)
      .join("/");
    this.helper.success({
      res: { url, thumbnailUrl: thumbnailUrl ? thumbnailUrl : url },
    });
  }
  @HTTPMethod({
    method: HTTPMethodEnum.POST,
    path: "/upload-stream",
  })
  async fileUploadByStream() {
    const stream = await this.EUtils.ctx.getFileStream();
    // uploads/***.ext
    // uploads/xxx_thumbnail.ext
    const uid = nanoid(6);
    const savedFilePath = join(
      this.config.baseDir,
      "uploads",
      uid + extname(stream.filename)
    );
    const savedThumbnailPath = join(
      this.config.baseDir,
      "uploads",
      "uid" + "_thumbnail" + uid + extname(stream.filename)
    );

    const target = createWriteStream(savedFilePath);
    const target2 = createWriteStream(savedThumbnailPath);
    const savePromise = pipeline(stream, target);
    const transformer = sharp().resize({ width: 300 });
    const thumbnailPromise = pipeline(stream, transformer, target2);
    try {
      await Promise.all([savePromise, thumbnailPromise]);
    } catch (error) {
      return this.helper.error({ errorType: "imageUploadFail" });
    }

    this.helper.success({
      res: {
        url: this.pathToURL(savedFilePath),
        thumbnailUrl: this.pathToURL(savedThumbnailPath),
      },
    });
  }

  @HTTPMethod({
    method: HTTPMethodEnum.POST,
    path: "/upload-stream-oss",
  })
  async uploadToOSS() {
    const stream = await this.EUtils.ctx.getFileStream();
    const savedOSSPath = join(
      "folder-test",
      nanoid(6) + extname(stream.filename)
    );
    try {
      const result = await this.EUtils.ctx.oss.put(savedOSSPath, stream);
      this.logger.info(result);
      const { name, url } = result;
      this.helper.success({ res: { name, url } });
    } catch (e) {
      await sendToWormhole(stream);
      this.helper.error({ errorType: "imageUploadFail" });
    }

    //文件上传模式
    //get stream to local path
    //file upload to oss
    //delete local file
    //Stream模式
    //get stream upload to OSS
  }

  @HTTPMethod({
    method: HTTPMethodEnum.POST,
    path: "/upload-busboy",
  })
  async uploadByBusboy() {
    const results = await this.uploadFileUseBusBoy();
    this.helper.success({ res: results });
  }

  @HTTPMethod({
    method: HTTPMethodEnum.POST,
    path: "/upload-multiple",
  })
  async uploadMultipleFiles() {
    //
    const { fileSize } = this.config.multipart;
    console.log("9999999999999999");
    console.log(fileSize);
    let i = 0;

    const parts = this.EUtils.ctx.multipart({
      limits: { fileSize: fileSize as number },
    });
    //{ urls:[xxx,xxx]}
    const urls: string[] = [];

    let part: FileStream | string[];
    while ((part = await parts())) {
      console.log("888" + i++);
      if (Array.isArray(part)) {
        this.logger.info(part);
      } else {
        try {
          console.log("ossbegin");
          const savedOSSPath = join(
            "folder-test",
            nanoid(6) + extname(part.filename)
          );
          const result = await this.EUtils.ctx.oss.put(savedOSSPath, part);
          const { url } = result;
          console.log(result);
          urls.push(url);
          if (part.truncated) {
            await this.EUtils.ctx.oss.delete(savedOSSPath);
            return this.helper.error({
              errorType: "imageUploadFileSizeError",
              error: `Reach fileSize limit ${fileSize} bytes`,
            });
          }
        } catch (e) {
          await sendToWormhole(part);
          this.helper.error({ errorType: "imageUploadFail" });
        }
      }
    }
    this.helper.success({ res: { urls } });
  }

  // handle upload by busboy
  uploadFileUseBusBoy() {
    return new Promise<string[]>((resolve) => {
      const busboy = Busboy({ headers: this.EUtils.ctx.req.headers });
      const results: string[] = [];
      busboy.on("file", (fieldname, file, info) => {
        const { filename } = info;
        this.logger.info(fieldname, file, filename);
        const uid = nanoid(6);
        const savedFilePath = join(
          this.config.baseDir,
          "uploads",
          uid + extname(filename)
        );
        file.pipe(createWriteStream(savedFilePath));
        file.on("end", () => {
          results.push(savedFilePath);
        });
      });
      busboy.on("field", (fieldname, val) => {
        this.logger.info(fieldname, val);
      });
      busboy.on("finish", () => {
        this.logger.info("finished");
        resolve(results);
      });
      this.EUtils.ctx.req.pipe(busboy);
    });
  }
  pathToURL(pathStr: string) {
    return pathStr
      .replace(this.config.baseDir, this.config.baseUrl)
      .split(path.sep)
      .join("/");
  }
  splitIdAndUuid(str = "") {
    const result = { id: "", uuid: "" };
    if (!str) return result;
    const firstDashIndex = str.indexOf("-");
    if (firstDashIndex < 0) return result;
    result.id = str.slice(0, firstDashIndex);
    result.uuid = str.slice(firstDashIndex + 1);
    return result;
  }
}
