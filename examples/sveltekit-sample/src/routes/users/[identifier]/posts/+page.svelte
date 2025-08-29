<script lang="ts">
  import type { PageProps } from "./$types";
  import { browser } from "$app/environment";
  import { getPosts } from "./data.remote";
  import Spinner from "$lib/components/Spinner.svelte";
  import type { Person } from "@fedify/fedify";

  let { params }: PageProps = $props();
  const { identifier } = params;
  const query = getPosts();
  const data = browser
    ? fetch(`/users/${identifier}`, {
        headers: { Accept: "application/activity+json" },
      }).then(
        (res) => res.json() as Promise<Person & { icon: { url: string } }>,
      )
    : Promise.resolve(null);
</script>

<form method="POST" action="?/post" class="post-form">
  <input name="identifier" type="hidden" value={identifier} />
  <div class="form-group">
    <label class="form-label">
      새 포스트 작성
      <textarea
        name="content"
        class="form-textarea"
        placeholder="무엇을 생각하고 계신가요?"
        rows="3"
      ></textarea>
    </label>
  </div>
  <button type="submit" class="post-button">게시하기</button>
</form>

{#if query.error}
  <div class="error-state">
    <p>포스트를 불러오는 중 오류가 발생했습니다.</p>
  </div>
{:else if query.loading}
  <div class="loading-state">
    <Spinner />
    <p>포스트를 불러오는 중...</p>
  </div>
{:else if query.current}
  <div class="posts-container">
    <h2 class="posts-title">포스트 목록</h2>
    <div class="posts-grid">
      {#each query.current as note}
        <article class="post-card">
          <a href={note.url} class="post-link">
            <div class="post-header">
              {#await data}
                <div class="skeleton-avatar"></div>
                <div class="skeleton-info">
                  <div class="skeleton-line skeleton-name"></div>
                  <div class="skeleton-line skeleton-handle"></div>
                </div>
              {:then user}
                {#if user}
                  <img
                    src={user.icon?.url ?? "/demo-profile.png"}
                    alt="{user.name}'s profile"
                    class="post-avatar"
                  />
                  <div class="post-user-info">
                    <h3 class="post-user-name">{user.name}</h3>
                    <p class="post-user-handle">
                      @{identifier}@{window.location.host}
                    </p>
                  </div>
                {/if}
              {/await}
            </div>
            <div class="post-content">
              <p>{note.content}</p>
            </div>
          </a>
        </article>
      {/each}
    </div>
  </div>
{/if}
