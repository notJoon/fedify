/**
 * Testing utilities for Fedify applications.
 *
 * This module provides mock implementations of the {@link Federation} and
 * {@link Context} interfaces to facilitate unit testing of federated applications
 * built with Fedify.
 *
 * @module
 */

export type { SentActivity } from "./mock.ts";
export { MockContext, MockFederation } from "./mock.ts";
export { mockDocumentLoader } from "./docloader.ts";
export { createContext } from "./context.ts";
