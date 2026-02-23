/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_runAnalysis from "../actions/runAnalysis.js";
import type * as analyses from "../analyses.js";
import type * as lib_analysis_assembler from "../lib/analysis/assembler.js";
import type * as lib_analysis_colors from "../lib/analysis/colors.js";
import type * as lib_analysis_css from "../lib/analysis/css.js";
import type * as lib_analysis_exports from "../lib/analysis/exports.js";
import type * as lib_analysis_gemini from "../lib/analysis/gemini.js";
import type * as lib_rateLimiter from "../lib/rateLimiter.js";
import type * as lib_types_profile from "../lib/types/profile.js";
import type * as urlCache from "../urlCache.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/runAnalysis": typeof actions_runAnalysis;
  analyses: typeof analyses;
  "lib/analysis/assembler": typeof lib_analysis_assembler;
  "lib/analysis/colors": typeof lib_analysis_colors;
  "lib/analysis/css": typeof lib_analysis_css;
  "lib/analysis/exports": typeof lib_analysis_exports;
  "lib/analysis/gemini": typeof lib_analysis_gemini;
  "lib/rateLimiter": typeof lib_rateLimiter;
  "lib/types/profile": typeof lib_types_profile;
  urlCache: typeof urlCache;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
