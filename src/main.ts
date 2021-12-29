// must be first so that configuration logic it contains executes first
export {
  enableErrorBoundaries,
  integrateGlobalState,
} from "./mobxConfiguration";

export { observer, runInAction } from "./libraryImports";
export { observable } from "./observable";
export { reactively } from "./reactively";
