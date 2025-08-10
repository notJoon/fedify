import {
  Create,
  createFederation,
  CustomCollectionDispatcher,
  MemoryKvStore,
  RequestContext,
} from "@fedify/fedify";
import {
  handleCustomCollection,
} from "../../packages/fedify/src/federation/handler.ts";
import {
  createRequestContext,
} from "../../packages/fedify/src/testing/context.ts";

// Mock data - in a real application, this would query your database
const POSTS = [
  new Create({
    id: new URL("https://example.com/posts/post-1"),
    content: "ActivityPub is a decentralized social networking protocol...",
    tags: [
      new URL("https://example.com/tags/ActivityPub"),
      new URL("https://example.com/tags/Decentralization"),
    ],
  }),
  new Create({
    id: new URL("https://example.com/posts/post-2"),
    content: "Fedify makes it easy to build federated applications...",
  }),

  new Create({
    id: new URL("https://example.com/posts/post-3"),
    content: "WebFinger is a protocol for discovering information...",
    tags: [new URL("https://example.com/tags/ActivityPub")],
  }),

  new Create({
    id: new URL("https://example.com/posts/post-4"),
    content: "HTTP Signatures provide authentication for ActivityPub...",
  }),

  new Create({
    id: new URL("https://example.com/posts/post-5"),
    content: "Understanding ActivityPub's data model is crucial...",
  }),
];

function getTaggedPostsByTag(tag: string): Promise<Create[]> {
  return Promise.resolve(
    POSTS.filter((post) => {
      return post.tagIds?.some((tagId) => tagId.toString() === tag);
    }),
  );
}

function getTaggedPostsCounts(tag: string): Promise<number> {
  return Promise.resolve(
    POSTS.filter((post) => {
      return post.tagIds?.some((tagId) => tagId.toString() === tag);
    }).length,
  );
}

async function demonstrateCustomCollection() {
  // Note: federation instance created for demonstration
  const federation = createFederation<void>({ kv: new MemoryKvStore() });
  const url = new URL("https://example.com/");
  const context = createRequestContext<void>({
    federation,
    data: undefined,
    url,
    request: new Request(url, {
      headers: {
        Accept: "application/activity+json",
      },
    }),
  });

  federation.setCollectionDispatcher(
    "TaggedPosts",
    Create,
    "/tags/{tag}",
    async (
      _ctx: { url: URL },
      values: Record<string, string>,
      cursor: string | null,
    ) => {
      if (values.handle !== "someone") return null; // Example handle check
      const posts = await getTaggedPostsByTag(values.tag);

      if (cursor != null) {
        const idx = parseInt(cursor);
        return {
          items: [posts[idx]],
          nextCursor: idx < posts.length - 1 ? (idx + 1).toString() : null,
          prevCursor: idx > 0 ? (idx - 1).toString() : null,
        };
      }
      return { items: posts };
    },
  ).setCounter(async (_ctx, values) => {
    // Return the total count of bookmarked posts
    const count = await getTaggedPostsCounts(values.tag);
    return count;
  });

  const dispatcher: CustomCollectionDispatcher<
    Create,
    Record<string, string>,
    RequestContext<unknown>,
    unknown
  > = async (_ctx, values, cursor) => {
    if (values.handle !== "someone") return null; // Example handle check
    const posts = await getTaggedPostsByTag(values.tag);
    if (cursor != null) {
      const idx = parseInt(cursor);
      return {
        items: [posts[idx]],
        nextCursor: idx < posts.length - 1 ? (idx + 1).toString() : null,
        prevCursor: idx > 0 ? (idx - 1).toString() : null,
      };
    }
    return { items: posts };
  };

  let _onNotFoundCalled: Request | null = null;
  const onNotFound = (request: Request) => {
    _onNotFoundCalled = request;
    return new Response("Not found", { status: 404 });
  };

  const onNotAcceptable = (_request: Request) => {
    return new Response("Not acceptable", { status: 406 });
  };

  const onUnauthorized = (_request: Request) => {
    return new Response("Unauthorized", { status: 401 });
  };

  const values = {
    handle: "someone",
    tag: "https://example.com/tags/ActivityPub",
  };

  const response = await handleCustomCollection(
    context.request,
    {
      context,
      name: "TaggedPosts",
      values: {
        handle: "someone",
        tag: "https://example.com/tags/ActivityPub",
      },
      collectionCallbacks: { dispatcher },
      onNotFound,
      onNotAcceptable,
      onUnauthorized,
    },
  );

  console.log("Custom collection response status:", response.status);

  if (response.ok) {
    const jsonResponse = await response.json();
    console.log("Custom collection data:", jsonResponse);
  } else {
    const errorText = await response.text();
    console.log("Error response:", errorText);
  }

  console.log(
    `Demonstration complete. Collection for tag: ${
      values.tag.toString().split("/").pop()
    }`,
  );
}

if (import.meta.main) {
  demonstrateCustomCollection().catch(console.error);
}
