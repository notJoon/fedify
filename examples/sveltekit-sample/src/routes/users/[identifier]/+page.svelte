<script lang="ts">
  import type { PageProps } from "./$types";
  import { browser } from "$app/environment";
  import type { Person } from "@fedify/fedify";
  import Spinner from "$lib/components/Spinner.svelte";

  let { params }: PageProps = $props();
  const { identifier } = params;
  const data = browser
    ? fetch(`/users/${identifier}`, {
        headers: { Accept: "application/activity+json" },
      }).then(
        (res) => res.json() as Promise<Person & { icon: { url: string } }>,
      )
    : Promise.resolve(null);
</script>

{#await data}
  <!-- promise is pending -->
  <div class="flex h-svh w-svw items-center justify-center">
    <Spinner />
  </div>
{:then user}
  {#if user}
    <div class="profile-container">
      <div class="profile-header">
        <div class="avatar-section">
          <img
            src={user.icon?.url ?? "/demo-profile.png"}
            alt="{user.name}'s profile"
            class="avatar"
          />
        </div>
        <div class="user-info">
          <h1 class="user-name">{user.name}</h1>
          <p class="user-handle">@{identifier}@{window.location.host}</p>
          {#if user.summary}
            <p class="user-bio">{user.summary}</p>
          {/if}
        </div>
      </div>

      <div class="profile-content">
        <div class="info-card">
          <h3>Profile Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Information</span>
              <span class="info-value"
                >This profile is demo for
                <a
                  href="https://fedify.dev"
                  class="fedify-anchor"
                  target="_blank"
                >
                  Fedify
                </a>–<a href="https://svelte.dev/">
                  <img
                    src="/svelte-horizontal.svg"
                    alt="Next.js"
                    class="inline-block h-5"
                  />
                </a> integration.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
{:catch}
  <h1>404 Not found</h1>
{/await}
