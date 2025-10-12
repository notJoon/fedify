import type { DocumentLoader } from "@fedify/vocab-runtime";

// deno-lint-ignore require-await
export const mockDocumentLoader: DocumentLoader = async (url: string) => ({
  contextUrl: null,
  document: {},
  documentUrl: url,
});
