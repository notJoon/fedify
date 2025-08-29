import { query } from "$app/server";
import { postStore } from "$lib/store";

export const getPosts = query(async () => postStore.getAll());
