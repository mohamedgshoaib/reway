import { SupabaseClient, User } from "@supabase/supabase-js"
import { normalizeUrl } from "@/lib/metadata"
import { getDomain } from "@/lib/utils"
import { Database } from "./database.types"

type SeedBookmark = {
  url: string
  title: string
  description?: string
  favicon_url?: string
  og_image_url?: string
}

type SeedGroup = {
  name: string
  icon: string
  color: string
  bookmarks: SeedBookmark[]
}

export const DEMO_GROUPS: SeedGroup[] = [
  {
    name: "Welcome",
    icon: "ZapIcon",
    color: "#ea8620", // Orange
    bookmarks: [
      {
        url: "https://www.reway.page/about",
        title: "About Reway",
        description: "Learn why Reway was built and the philosophy behind it.",
        favicon_url: "https://www.reway.page/favicon.ico",
        og_image_url: "https://reway.page/opengraph-image.png",
      },
      {
        url: "https://drive.google.com/file/d/10rypTtZMKT_IR53b5cS7epw7acEoC9WW/view?usp=sharing",
        title: "Download Reway Extension",
        description: "Our extension enables powerful features.",
        favicon_url: "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png",
      },
      {
        url: "https://github.com/mohamed-g-shoaib/reway",
        title: "Reway Source Code on GitHub",
        description: "View the source code and contribute to the project.",
        favicon_url: "https://www.svgrepo.com/show/475654/github-color.svg",
        og_image_url:
          "https://opengraph.githubassets.com/0b80793906916aa11ea73201da3a1dd1d2f692b9a3038c01c7b0e536b43bd8c1/mohamed-g-shoaib/reway",
      },
      {
        url: "https://x.com/devloopsoftware",
        title: "Follow us on X (Devloop)",
        description: "Stay updated with Devloop.",
        favicon_url: "https://x.com/favicon.ico",
      },
    ],
  },
  {
    name: "AI",
    icon: "ai-magic",
    color: "#7c3aed", // Purple
    bookmarks: [
      {
        url: "https://claude.ai/new",
        title: "Claude",
        description: "Anthropic's helpful AI assistant.",
        favicon_url: "https://claude.ai/favicon.ico",
        og_image_url: "https://claude.ai/images/claude_ogimage.png",
      },
      {
        url: "https://chatgpt.com/",
        title: "ChatGPT",
        description: "OpenAI's conversational AI.",
        favicon_url: "https://chatgpt.com/favicon.ico",
        og_image_url: "https://cdn.openai.com/chatgpt/share-og.png",
      },
      {
        url: "https://www.kimi.com/",
        title: "Kimi AI",
        description: "Visual Coding Meets Agent Swarm.",
        favicon_url: "https://www.kimi.com/favicon.ico",
      },
      {
        url: "https://chat.deepseek.com/",
        title: "DeepSeek",
        description: "Into the Unknown.",
        favicon_url: "https://cdn.deepseek.com/chat/icon.png",
        og_image_url: "https://cdn.deepseek.com/images/deepseek-chat-open-graph-image.jpeg",
      },
      {
        url: "https://www.perplexity.ai/",
        title: "Perplexity",
        description:
          "AI-powered answer engine that provides accurate, trusted, and real-time answers to any question.",
        favicon_url: "https://www.perplexity.ai/favicon.ico",
        og_image_url: "https://www.perplexity.ai/og-image.png",
      },
    ],
  },
  {
    name: "UI",
    icon: "layout",
    color: "#0891b2", // Cyan
    bookmarks: [
      {
        url: "https://ui.shadcn.com/",
        title: "shadcn/ui",
        description: "The Foundation for your Design System.",
        favicon_url: "https://ui.shadcn.com/favicon.ico",
        og_image_url:
          "https://ui.shadcn.com/og?title=The%20Foundation%20for%20your%20Design%20System&description=A%20set%20of%20beautifully%20designed%20components%20that%20you%20can%20customize%2C%20extend%2C%20and%20build%20on.%20Start%20here%20then%20make%20it%20your%20own.%20Open%20Source.%20Open%20Code.",
      },
      {
        url: "https://skiper-ui.com/",
        title: "Skiper UI",
        description: "Un-common Components for shadcn/ui.",
        favicon_url: "https://skiper-ui.com/favicon.ico",
        og_image_url: "https://skiper-ui.com/og-main.png",
      },
      {
        url: "https://pure.kam-ui.com/",
        title: "Kam UI",
        description: "Minimalist component library.",
        favicon_url: "https://pure.kam-ui.com/favicon.ico",
      },
      {
        url: "https://www.smoothui.dev/",
        title: "Smooth UI",
        description: "Animated React Components for shadcn/ui | Motion & Tailwind.",
        favicon_url: "https://www.smoothui.dev/favicon.ico",
        og_image_url: "https://smoothui.dev/og-optimized.webp",
      },
      {
        url: "https://mapcn.vercel.app/",
        title: "Mapcn",
        description: "Beautiful maps made simple.",
        favicon_url: "https://mapcn.vercel.app/icon.svg",
        og_image_url: "https://mapcn.dev/banner.png",
      },
    ],
  },
]

export const DEMO_NOTES = [
  {
    text: "Don't forget to try all view modes (List, Card, and Folders) to find your favorite setup!",
    color: "#f59e0b", // Amber
  },
  {
    text: "Did you know that Reway has over 15 themes? You can change them from settings or from the theme icon before your profile picture.",
    color: "#8b5cf6", // Violet
  },
  {
    text: "You can drag and drop bookmarks to organize them, you can also drag and drop groups in the sidebar to reorder them.",
    color: "#10b981", // Emerald
  },
  {
    text: "Click on a bookmark's icon or name or url to open it, or click on any empty space in the bookmark card to drag and drop it.",
    color: "#3b82f6", // Blue
  },
]

export const DEMO_TODOS = [
  { text: "Add your first bookmark", priority: "high" },
  { text: "Create a custom group", priority: "medium" },
  { text: "Import your browser bookmarks", priority: "low" },
  { text: "Try reordering your groups", priority: "low" },
  { text: "Try reordering your bookmarks", priority: "low" },
]

/**
 * Seeds a new user with default demo data if they haven't been seeded yet.
 * Uses user_metadata to track seeding status across sessions.
 */
export async function seedNewUser(supabase: SupabaseClient<Database>, user: User) {
  try {
    const userId = user.id
    const hasSeeded = user.user_metadata?.has_seeded

    // 1. If metadata flag exists, definitively skip
    if (hasSeeded) {
      return
    }

    // 2. Check for existing groups to determine if user is new or existing
    const { data: userGroups, error: groupsError } = await supabase
      .from("groups")
      .select("id, name")
      .eq("user_id", userId)

    if (groupsError) throw groupsError

    const existingGroups = userGroups || []

    // If they have groups, assume they are already seeded or have their own data
    if (existingGroups.length > 0) {
      await supabase.auth.updateUser({ data: { has_seeded: true } })
      return
    }

    // 3. New User -> Create groups and bookmarks in the specified order
    for (let i = 0; i < DEMO_GROUPS.length; i++) {
      const groupData = DEMO_GROUPS[i]
      if (!groupData) continue

      // react-doctor-disable-next-line react-doctor/async-await-in-loop
      const { data: newGroup, error: createGroupError } = await supabase
        .from("groups")
        .insert({
          name: groupData.name,
          icon: groupData.icon,
          color: groupData.color,
          user_id: userId,
          order_index: i,
        })
        .select("id")
        .single()

      if (createGroupError) {
        // Handle rare race condition
        if (createGroupError.code === "23505") continue
        throw createGroupError
      }

      if (!newGroup) continue

      // Add demo bookmarks for this group
      const bookmarksToInsert = groupData.bookmarks.map((bm, bIndex) => {
        const normalized = normalizeUrl(bm.url)
        const domain = getDomain(normalized)
        const ogImageUrl = bm.og_image_url ?? null

        return {
          url: bm.url,
          normalized_url: normalized,
          domain,
          title: bm.title,
          description: bm.description ?? null,
          favicon_url: bm.favicon_url ?? null,
          og_image_url: ogImageUrl,
          image_url: ogImageUrl,
          group_id: newGroup.id,
          user_id: userId,
          status: "ready" as const,
          order_index: bIndex,
        }
      })

      const { error: insertError } = await supabase.from("bookmarks").insert(bookmarksToInsert)

      if (insertError) throw insertError
    }

    // 4. Seed Notes
    const notesToInsert = DEMO_NOTES.map((note, index) => ({
      text: note.text,
      color: note.color,
      user_id: userId,
      order_index: index,
    }))

    const { error: notesError } = await supabase.from("notes").insert(notesToInsert)

    if (notesError) throw notesError

    // 5. Seed Todos
    const todosToInsert = DEMO_TODOS.map((todo, index) => ({
      text: todo.text,
      priority: todo.priority as "low" | "medium" | "high",
      completed: false,
      user_id: userId,
      order_index: index,
    }))

    const { error: todosError } = await supabase.from("todos").insert(todosToInsert)

    if (todosError) throw todosError

    // 6. Final step: Flag the user as seeded in their metadata
    await supabase.auth.updateUser({
      data: { has_seeded: true },
    })

    console.log(`[Seed] Successfully seeded user ${userId} with demo data.`)
  } catch (error) {
    console.error("[Seed] Failed to seed user:", error)
  }
}
