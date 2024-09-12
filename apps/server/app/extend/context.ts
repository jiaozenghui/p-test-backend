import { Context } from "egg";

class BcryptEgg {
  ctx: Context;
  constructor(ctx) {
    this.ctx = ctx;
  }

  genHash(plainText: string): Promise<string> {
    return this.ctx.genHash(plainText);
  }
  compare(plainText: string, hash: string): Promise<boolean> {
    return this.ctx.compare(plainText, hash);
  }
}

class EUtils {
  ctx: Context;
  constructor(ctx) {
    this.ctx = ctx;
  }

  redirect(url: string) {
    return this.ctx.redirect(url);
  }
  render(template: any, params) {
    return this.ctx.render(template, params);
  }
  /*   curl<T>(url: string, params: any) {
    return this.ctx.curl<T>(url, params);
  } */
}

const BCRYPT_EGG = Symbol("context#bcryptEgg");
const EUTILS = Symbol("context#EUtils");

export default {
  get bcryptEgg() {
    if (!this[BCRYPT_EGG]) {
      this[BCRYPT_EGG] = new BcryptEgg(this);
    }
    return this[BCRYPT_EGG];
  },
  get EUtils() {
    if (!this[EUTILS]) {
      this[EUTILS] = new EUtils(this);
    }
    return this[EUTILS];
  },
};
