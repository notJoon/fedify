import {
  Create,
  createFederation,
  CustomCollectionCounter,
  CustomCollectionDispatcher,
  MemoryKvStore,
  RequestContext,
} from "@fedify/fedify";

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

function getPosts(): Promise<Create[]> {
  return Promise.resolve(POSTS);
}

function getPostsCounts(): number {
  return 5;
}

function getTaggedPostsByTag(tag: string): Promise<Create[]> {
  return Promise.resolve(
    POSTS.filter((post) => {
      return post.tagIds?.some((tagId) => tagId.toString() === tag);
    }),
  );
}

async function demonstrateCustomCollection() {
  // Note: federation instance created for demonstration
  const federation = createFederation<void>({ kv: new MemoryKvStore() });
  let context = createRequestContext<void>({
    federation,
    data: undefined,
    url: new URL("https://example.com/"),
  });

  // Create a simple dispatcher function for testing
  const postsDispatcher: CustomCollectionDispatcher<
    Create,
    Record<string, string>,
    RequestContext<void>,
    void
  > = async (
    _ctx: { url: URL },
    values: Record<string, string>,
    cursor: string | null,
  ) => {
    if (values.handle !== "someone") return null;

    const posts = await getPosts();
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

  const taggedPostsDispatcher: CustomCollectionDispatcher<
    Create,
    Record<string, string>,
    RequestContext<void>,
    void
  > = async (
    _ctx: { url: URL },
    values: Record<string, string>,
    cursor: string | null,
  ) => {
    if (values.handle !== "someone") return null;

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

  const counter: CustomCollectionCounter<Record<string, string>, void> = (
    _ctx: RequestContext<void>,
    values: Record<string, string>,
  ) => values.handle === "someone" ? getPostsCounts() : null;

  const values = {
    handle: "someone",
    tag: "https://example.com/tags/ActivityPub",
  };
  const posts = await postsDispatcher(context, values, null);
  console.log("All Posts for user: ", values.handle);
  console.log(posts);

  const count = await counter(context, values);
  console.log("Count:", count);

  // Example of using a custom collection to get tagged posts
  const taggedPosts = await taggedPostsDispatcher(context, values, null);
  console.log(
    `${values.tag.toString().split("/").pop()} Tagged Posts:`,
    taggedPosts,
  );
}

if (import.meta.main) {
  demonstrateCustomCollection().catch(console.error);
}
