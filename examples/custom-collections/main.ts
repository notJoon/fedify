import { Create, createFederation, MemoryKvStore, Note } from "@fedify/fedify";
import { print } from "ioredis";

// Mock data - in a real application, this would query your database
const POSTS = [
  new Note({
    id: new URL("https://example.com/posts/post-1"),
    content: "ActivityPub is a decentralized social networking protocol...",
    tags: [
      new URL("https://example.com/tags/ActivityPub"),
      new URL("https://example.com/tags/Decentralization"),
    ],
  }),
  new Note({
    id: new URL("https://example.com/posts/post-2"),
    content: "Fedify makes it easy to build federated applications...",
  }),

  new Note({
    id: new URL("https://example.com/posts/post-3"),
    content: "WebFinger is a protocol for discovering information...",
    tags: [new URL("https://example.com/tags/ActivityPub")],
  }),

  new Note({
    id: new URL("https://example.com/posts/post-4"),
    content: "HTTP Signatures provide authentication for ActivityPub...",
  }),

  new Note({
    id: new URL("https://example.com/posts/post-5"),
    content: "Understanding ActivityPub's data model is crucial...",
  }),
];

function getTagFromUrl(url: string): string {
  const parts = url.split("/");
  return parts[parts.length - 1];
}

function getTaggedPostsByTag(tag: string): Note[] {
  return POSTS
    .filter((post) => {
      if (!post.tagIds) {
        return false;
      }
      return post.tagIds.some((tagId) => {
        return getTagFromUrl(tagId.toString()) === tag;
      });
    });
}

async function demonstrateCustomCollection() {
  // Note: federation instance created for demonstration
  const federation = createFederation<void>({ kv: new MemoryKvStore() });

  federation.setCollectionDispatcher(
    "TaggedPosts",
    Note,
    "/users/{userId}/tags/{tag}",
    (
      _ctx: { url: URL },
      values: Record<string, string>,
      cursor: string | null,
    ) => {
      if (!values.userId || !values.tag) {
        throw new Error("Missing userId or tag in values");
      }
      const posts = getTaggedPostsByTag(values.tag);

      if (cursor != null) {
        const idx = Number.parseInt(cursor, 10);
        if (Number.isNaN(idx)) {
          throw new Error("Invalid cursor");
        }
        return {
          items: idx < posts.length ? [posts[idx]] : [],
          nextCursor: idx < posts.length - 1 ? (idx + 1).toString() : null,
          prevCursor: idx > 0 ? (idx - 1).toString() : null,
        };
      }
      return { items: posts, nextCursor: null, prevCursor: null };
    },
  ).setCounter(async (_ctx, values) => {
    // Return the total count of tagged posts
    const count = getTaggedPostsByTag(values.tag).length;
    return count;
  });

  const response = await federation.fetch(
    new Request(
      "https://example.com/users/someone/tags/ActivityPub",
      {
        headers: {
          Accept: "application/activity+json",
        },
      },
    ),
    {
      contextData: undefined,
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
}

if (import.meta.main) {
  demonstrateCustomCollection().catch(console.error);
}
