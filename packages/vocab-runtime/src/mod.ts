/**
 * This package contains the runtime facilities for working with Activity
 * Vocabulary objects, which are auto-generated from the IDL.
 *
 * @module
 */
export {
  type AuthenticatedDocumentLoaderFactory,
  type DocumentLoader,
  type DocumentLoaderFactory,
  type DocumentLoaderFactoryOptions,
  type DocumentLoaderOptions,
  getDocumentLoader,
  type GetDocumentLoaderOptions,
  getRemoteDocument,
  type RemoteDocument,
} from "./docloader.ts";
export {
  exportMultibaseKey,
  exportSpki,
  importMultibaseKey,
  importPem,
  importPkcs1,
  importSpki,
} from "./key.ts";
export { LanguageString } from "./langstr.ts";
export {
  decodeMultibase,
  encodeMultibase,
  encodingFromBaseData,
} from "./multibase/mod.ts";
