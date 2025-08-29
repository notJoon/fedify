<script lang="ts">
  import type { PageProps } from "./$types";
  import { browser } from "$app/environment";
  import type { Person } from "@fedify/fedify";

  let { params }: PageProps = $props();
  const { identifier } = params;
  $effect(() => {
    console.log(identifier);
  });
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
    <svg
      class="mr-3 -ml-1 size-24 animate-spin text-blue-500"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      ><circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      ></circle><path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path></svg
    >
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
