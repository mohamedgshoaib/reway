"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { fetchMetadata, normalizeUrl } from "@/lib/metadata";
import { getDomain } from "@/lib/utils";
import { toPersistedGroupId } from "@/lib/system-groups";

export async function checkDuplicateBookmarks(urls: string[]): Promise<{
  duplicates: Record<string, { id: string; title: string; url: string }>;
}> {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Unauthorized");
  }

  const normalizedUrls = urls.map((url) => normalizeUrl(url));

  const { data } = await supabase
    .from("bookmarks")
    .select("id, title, url, normalized_url")
    .eq("user_id", userData.user.id)
    .in("normalized_url", normalizedUrls);

  const duplicates: Record<string, { id: string; title: string; url: string }> =
    {};
  if (data) {
    for (const bookmark of data) {
      if (bookmark.normalized_url) {
        duplicates[bookmark.normalized_url] = {
          id: bookmark.id,
          title: bookmark.title,
          url: bookmark.url,
        };
      }
    }
  }

  return { duplicates };
}

export async function addBookmark(formData: {
  url: string;
  id?: string;
  title?: string;
  favicon_url?: string;
  og_image_url?: string;
  description?: string;
  group_id?: string;
  order_index?: number;
}) {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Unauthorized");
  }

  let nextOrderIndex = formData.order_index;
  if (nextOrderIndex === undefined || nextOrderIndex === null) {
    const { data: minOrderData } = await supabase
      .from("bookmarks")
      .select("order_index")
      .order("order_index", { ascending: true })
      .limit(1)
      .single();

    nextOrderIndex = minOrderData ? (minOrderData.order_index ?? 0) - 1 : 0;
  }

  const normalizedUrl = normalizeUrl(formData.url);
  const title = formData.title || normalizedUrl;
  const domain = getDomain(formData.url);
  const persistedGroupId = toPersistedGroupId(formData.group_id);

  const { data, error } = await supabase
    .from("bookmarks")
    .insert({
      id: formData.id,
      url: formData.url,
      normalized_url: normalizedUrl,
      domain,
      title: title,
      favicon_url: formData.favicon_url,
      og_image_url: formData.og_image_url,
      image_url: formData.og_image_url,
      description: formData.description,
      group_id: persistedGroupId,
      user_id: userData.user.id,
      status: "pending",
      visit_count: 0,
      last_visited_at: null,
      order_index: nextOrderIndex,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error adding bookmark:", error);
    throw new Error("Failed to add bookmark");
  }

  revalidatePath("/dashboard");
  return data.id;
}

export async function enrichCreatedBookmark(id: string, url: string) {
  try {
    const metadata = await fetchMetadata(url);
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw new Error("Unauthorized");
    }

    const { data: existingBookmark, error: bookmarkError } = await supabase
      .from("bookmarks")
      .select("id, title, url, normalized_url")
      .eq("id", id)
      .eq("user_id", userData.user.id)
      .single();

    if (bookmarkError || !existingBookmark) {
      throw new Error("Failed to load bookmark for enrichment");
    }

    const nextTitle = metadata.title?.trim();
    const nextDescription = metadata.description?.trim();
    const nextFavicon = metadata.favicon?.trim();
    const nextOgImage = metadata.ogImage?.trim();
    const fetchedAt = new Date().toISOString();

    const fallbackTitleFromDomain = (domain: string) => {
      const key = domain.toLowerCase();
      if (key === "x.com" || key === "twitter.com") return "X";
      if (key === "tiktok.com") return "TikTok";
      const parts = key.split(".").filter(Boolean);
      const base =
        parts.length >= 2 ? parts[parts.length - 2] : parts[0] || key;
      return base ? base.charAt(0).toUpperCase() + base.slice(1) : null;
    };

    const currentTitle = (existingBookmark.title ?? "").trim();
    const currentUrl = (existingBookmark.url ?? "").trim();
    const currentNormalized = (existingBookmark.normalized_url ?? "").trim();
    const isDefaultTitle =
      !currentTitle ||
      currentTitle === currentUrl ||
      currentTitle === currentNormalized;

    const computedFallbackTitle =
      !nextTitle && isDefaultTitle
        ? fallbackTitleFromDomain(metadata.domain)
        : null;

    const titleToWrite = nextTitle || computedFallbackTitle || null;

    await supabase
      .from("bookmarks")
      .update({
        ...(titleToWrite ? { title: titleToWrite } : {}),
        ...(nextDescription ? { description: nextDescription } : {}),
        ...(nextFavicon ? { favicon_url: nextFavicon } : {}),
        ...(nextOgImage
          ? { og_image_url: nextOgImage, image_url: nextOgImage }
          : {}),
        status: "ready",
        last_fetched_at: fetchedAt,
      })
      .eq("id", id)
      .eq("user_id", userData.user.id);

    revalidatePath("/dashboard");
    return {
      status: "ready" as const,
      title: titleToWrite || undefined,
      description: nextDescription || undefined,
      favicon_url: nextFavicon || undefined,
      og_image_url: nextOgImage || undefined,
      image_url: nextOgImage || undefined,
      last_fetched_at: fetchedAt,
      error_reason: null,
    };
  } catch (error) {
    console.error("Enrichment failed for", url, error);
    const attemptedAt = new Date().toISOString();
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw new Error("Unauthorized");
    }
    await supabase
      .from("bookmarks")
      .update({
        status: "failed",
        error_reason: error instanceof Error ? error.message : "Unknown error",
        last_fetched_at: attemptedAt,
      })
      .eq("id", id)
      .eq("user_id", userData.user.id);
    revalidatePath("/dashboard");
    return {
      status: "failed" as const,
      error_reason: error instanceof Error ? error.message : "Unknown error",
      last_fetched_at: attemptedAt,
    };
  }
}

export async function updateBookmarksOrder(
  updates: { id: string; order_index: number }[],
) {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Unauthorized");
  }

  const updatePromises = updates.map((update) =>
    supabase
      .from("bookmarks")
      .update({ order_index: update.order_index })
      .eq("id", update.id)
      .eq("user_id", userData.user.id),
  );

  const results = await Promise.all(updatePromises);

  const firstError = results.find((result) => result.error)?.error;
  if (firstError) {
    console.error("Error updating order:", firstError);
    throw new Error(`Failed to update order: ${firstError.message}`);
  }

  revalidatePath("/dashboard");
}

export async function moveBookmarksToGroup(
  ids: string[],
  targetGroupId: string | null,
) {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Unauthorized");
  }

  const uniqueIds = Array.from(new Set(ids)).filter(Boolean);
  if (uniqueIds.length === 0) return;

  if (targetGroupId) {
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id")
      .eq("id", targetGroupId)
      .eq("user_id", userData.user.id)
      .single();

    if (groupError || !group) {
      throw new Error("Invalid target group");
    }
  }

  const { error } = await supabase
    .from("bookmarks")
    .update({ group_id: targetGroupId })
    .in("id", uniqueIds)
    .eq("user_id", userData.user.id);

  if (error) {
    console.error("Error moving bookmarks:", error);
    throw new Error("Failed to move bookmarks");
  }

  revalidatePath("/dashboard");
}

export async function deleteBookmarks(ids: string[]) {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Unauthorized");
  }

  const uniqueIds = Array.from(new Set(ids)).filter(Boolean);
  if (uniqueIds.length === 0) return;

  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .in("id", uniqueIds)
    .eq("user_id", userData.user.id);

  if (error) {
    console.error("Error deleting bookmarks:", error);
    throw new Error("Failed to delete bookmarks");
  }

  revalidatePath("/dashboard");
}

export async function restoreBookmark(bookmark: {
  id: string;
  url: string;
  title: string;
  description?: string | null;
  group_id?: string | null;
  favicon_url?: string | null;
  og_image_url?: string | null;
  image_url?: string | null;
  order_index?: number | null;
  created_at?: string | null;
  status?: string | null;
  visit_count?: number | null;
  last_visited_at?: string | null;
}) {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Unauthorized");
  }

  const normalizedUrl = normalizeUrl(bookmark.url);
  const domain = getDomain(bookmark.url);

  const { error } = await supabase.from("bookmarks").upsert(
    {
      id: bookmark.id,
      url: bookmark.url,
      normalized_url: normalizedUrl,
      domain,
      title: bookmark.title,
      description: bookmark.description ?? null,
      group_id: bookmark.group_id ?? null,
      favicon_url: bookmark.favicon_url ?? null,
      og_image_url: bookmark.og_image_url ?? null,
      image_url: bookmark.image_url ?? null,
      order_index: bookmark.order_index ?? null,
      created_at: bookmark.created_at ?? new Date().toISOString(),
      status: bookmark.status ?? "ready",
      visit_count: bookmark.visit_count ?? 0,
      last_visited_at: bookmark.last_visited_at ?? null,
      user_id: userData.user.id,
    },
    { onConflict: "id" },
  );

  if (error) {
    console.error("Error restoring bookmark:", error);
    throw new Error("Failed to restore bookmark");
  }

  revalidatePath("/dashboard");
}

export async function deleteBookmark(id: string) {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("id", id)
    .eq("user_id", userData.user.id);

  if (error) {
    console.error("Error deleting bookmark:", error);
    throw new Error("Failed to delete bookmark");
  }

  revalidatePath("/dashboard");
}

export async function enrichBookmark(
  id: string,
  metadata: {
    title?: string;
    favicon_url?: string;
    og_image_url?: string;
    description?: string;
    image_url?: string;
    status?: "pending" | "ready" | "failed";
  },
) {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("bookmarks")
    .update({
      ...metadata,
    })
    .eq("id", id)
    .eq("user_id", userData.user.id);

  if (error) {
    console.error("Error enriching bookmark:", error);
    return;
  }

  revalidatePath("/dashboard");
}

export async function updateBookmark(
  id: string,
  formData: {
    title: string;
    url: string;
    description?: string;
    group_id?: string | null;
    favicon_url?: string | null;
    apply_favicon_to_domain?: boolean;
  },
) {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Unauthorized");
  }

  const normalizedUrl = normalizeUrl(formData.url);
  const domain = getDomain(formData.url);

  const { error } = await supabase
    .from("bookmarks")
    .update({
      title: formData.title,
      url: formData.url,
      normalized_url: normalizedUrl,
      domain,
      description: formData.description,
      group_id: formData.group_id,
      favicon_url: formData.favicon_url,
    })
    .eq("id", id)
    .eq("user_id", userData.user.id);

  if (error) {
    console.error("Error updating bookmark:", error);
    throw new Error("Failed to update bookmark");
  }

  if (formData.apply_favicon_to_domain) {
    if (domain) {
      const { error: domainUpdateError } = await supabase
        .from("bookmarks")
        .update({ favicon_url: formData.favicon_url ?? null })
        .eq("user_id", userData.user.id)
        .eq("domain", domain);

      if (domainUpdateError) {
        console.error("Error updating domain favicon:", domainUpdateError);
        throw new Error("Failed to update domain favicon");
      }
    }
  }

  revalidatePath("/dashboard");
}
