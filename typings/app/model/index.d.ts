// This file is created by egg-ts-helper@2.1.0
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExportPuser from '../../../app/model/puser';
import ExportUser from '../../../app/model/user';
import ExportWork from '../../../app/model/work';
import ExportArticle from '../../../app/model/article';

declare module 'egg' {
  interface IModel {
    Puser: ReturnType<typeof ExportPuser>;
    User: ReturnType<typeof ExportUser>;
    Work: ReturnType<typeof ExportWork>;
    Article: ReturnType<typeof ExportArticle>;
  }
}
