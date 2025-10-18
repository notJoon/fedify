// deno-lint-ignore-file no-explicit-any
import type { Context, Federation } from "@fedify/fedify/federation";
import { RouterError } from "@fedify/fedify/federation";
import {
  lookupObject as globalLookupObject,
  traverseCollection as globalTraverseCollection,
} from "@fedify/fedify/vocab";
import { lookupWebFinger as globalLookupWebFinger } from "@fedify/fedify/webfinger";
import { mockDocumentLoader } from "./docloader.ts";

// Create a no-op tracer provider.
// We use `any` type instead of importing TracerProvider from @opentelemetry/api
// to avoid type graph analysis issues in JSR. When @opentelemetry/api types are
// imported alongside ResourceDescriptor from @fedify/fedify/webfinger, JSR's type
// analyzer hangs indefinitely during the "processing" stage.
// See: https://github.com/fedify-dev/fedify/issues/468
const noopTracerProvider: any = {
  getTracer: () => ({
    startActiveSpan: () => undefined as any,
    startSpan: () => undefined as any,
  }),
};

// NOTE: Copied from @fedify/fedify/testing/context.ts

export function createContext<TContextData>(
  values: Partial<Context<TContextData>> & {
    url?: URL;
    data: TContextData;
    federation: Federation<TContextData>;
  },
): Context<TContextData> {
  const {
    federation,
    url = new URL("http://example.com/"),
    canonicalOrigin,
    data,
    documentLoader,
    contextLoader,
    tracerProvider,
    clone,
    getNodeInfoUri,
    getActorUri,
    getObjectUri,
    getCollectionUri,
    getOutboxUri,
    getInboxUri,
    getFollowingUri,
    getFollowersUri,
    getLikedUri,
    getFeaturedUri,
    getFeaturedTagsUri,
    parseUri,
    getActorKeyPairs,
    getDocumentLoader,
    lookupObject,
    traverseCollection,
    lookupNodeInfo,
    lookupWebFinger,
    sendActivity,
    routeActivity,
  } = values;
  function throwRouteError(): URL {
    throw new RouterError("Not implemented");
  }
  return {
    federation,
    data,
    origin: url.origin,
    canonicalOrigin: canonicalOrigin ?? url.origin,
    host: url.host,
    hostname: url.hostname,
    documentLoader: documentLoader ?? mockDocumentLoader,
    contextLoader: contextLoader ?? mockDocumentLoader,
    tracerProvider: tracerProvider ?? noopTracerProvider,
    clone: clone ?? ((data) => createContext({ ...values, data })),
    getNodeInfoUri: getNodeInfoUri ?? throwRouteError,
    getActorUri: getActorUri ?? throwRouteError,
    getObjectUri: getObjectUri ?? throwRouteError,
    getCollectionUri: getCollectionUri ?? throwRouteError,
    getOutboxUri: getOutboxUri ?? throwRouteError,
    getInboxUri: getInboxUri ?? throwRouteError,
    getFollowingUri: getFollowingUri ?? throwRouteError,
    getFollowersUri: getFollowersUri ?? throwRouteError,
    getLikedUri: getLikedUri ?? throwRouteError,
    getFeaturedUri: getFeaturedUri ?? throwRouteError,
    getFeaturedTagsUri: getFeaturedTagsUri ?? throwRouteError,
    parseUri: parseUri ?? ((_uri) => {
      throw new Error("Not implemented");
    }),
    getDocumentLoader: getDocumentLoader ?? ((_params) => {
      throw new Error("Not implemented");
    }),
    getActorKeyPairs: getActorKeyPairs ?? ((_handle) => Promise.resolve([])),
    lookupObject: lookupObject ?? ((uri, options = {}) => {
      return globalLookupObject(uri, {
        documentLoader: options.documentLoader ?? documentLoader ??
          mockDocumentLoader,
        contextLoader: options.contextLoader ?? contextLoader ??
          mockDocumentLoader,
      });
    }),
    traverseCollection: traverseCollection ?? ((collection, options = {}) => {
      return globalTraverseCollection(collection, {
        documentLoader: options.documentLoader ?? documentLoader ??
          mockDocumentLoader,
        contextLoader: options.contextLoader ?? contextLoader ??
          mockDocumentLoader,
      });
    }),
    lookupNodeInfo: lookupNodeInfo ?? ((_params) => {
      throw new Error("Not implemented");
    }),
    lookupWebFinger: lookupWebFinger ?? ((resource, options = {}) => {
      return globalLookupWebFinger(resource, options);
    }),
    sendActivity: sendActivity ?? ((_params) => {
      throw new Error("Not implemented");
    }),
    routeActivity: routeActivity ?? ((_params) => {
      throw new Error("Not implemented");
    }),
  };
}
