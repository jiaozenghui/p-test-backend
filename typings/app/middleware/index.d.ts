// This file is created by egg-ts-helper@2.1.0
// Do not modify this file!!!!!!!!!
/* eslint-disable */

import 'egg';
import ExportCustomError from '../../../app/middleware/customError';

declare module 'egg' {
  interface IMiddleware {
    customError: typeof ExportCustomError;
  }
}
