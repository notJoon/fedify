<script lang="ts">
  import type { PageProps } from "./$types";
  import { getPosts } from "./data.remote";

  let { params }: PageProps = $props();
  const { identifier } = params;
  const query = getPosts();
</script>

<form method="POST" action="?/post">
  <input name="identifier" type="hidden" value={identifier} />
  <label>
    Content
    <input name="content" type="text" />
  </label>
  <button>Post</button>
</form>

{#if query.error}
  <p>oops!</p>
{:else if query.loading}
  <p>loading...</p>
{:else if query.current}
  <ul>
    {#each query.current as note}
      <pre>{JSON.stringify(note, null, 2)}</pre>
    {/each}
  </ul>
{/if}
