import { DashboardContent } from "@/components/dashboard/DashboardContent";

import { getUser } from "./layout";
import {
  getBookmarks,
  getGroups,
  getNotes,
  getTodos,
} from "@/lib/supabase/queries";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { cookies } from "next/headers";
import {
  getPaletteThemeClassName,
  isDashboardPaletteTheme,
  type DashboardPaletteTheme,
} from "@/lib/themes";

export const metadata = {
  title: "Dashboard",
  description: "Organize and search your bookmarks with Reway.",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const cookieStore = await cookies();

  // Helper to safely parse and validate cookie values
  const parseViewMode = (
    value: string | undefined,
    defaultValue: "list" | "card" | "folders" = "folders",
  ) => {
    if (value && ["list", "card", "folders"].includes(value)) {
      return value as "list" | "card" | "folders";
    }
    return defaultValue;
  };

  const parseRowContent = (value: string | undefined) => {
    if (value && ["date", "group"].includes(value)) {
      return value as "date" | "group";
    }
    return "date";
  };

  const parseCommandMode = (value: string | undefined) => {
    if (value && ["add", "search"].includes(value)) {
      return value as "add" | "search";
    }
    return "add";
  };

  const parseShowNotesTodos = (value: string | undefined) => {
    if (value === "false") {
      return false;
    }
    return true; // Default to true (show sidebar)
  };

  const parsePaletteTheme = (value: string | undefined) => {
    if (value && isDashboardPaletteTheme(value)) {
      return value as DashboardPaletteTheme;
    }
    return "default";
  };

  const parseLayoutDensity = (value: string | undefined) => {
    if (value && ["compact", "extended"].includes(value)) {
      return value as "compact" | "extended";
    }
    return "extended";
  };

  const parseFolderHeaderTint = (value: string | undefined) => {
    if (value && ["off", "low", "medium", "high"].includes(value)) {
      return value as "off" | "low" | "medium" | "high";
    }
    return "off";
  };

  // Read and validate dashboard preferences from cookies
  const viewModeAll = parseViewMode(
    cookieStore.get("reway.dashboard.viewMode.all")?.value,
    "folders",
  );
  const viewModeGroups = parseViewMode(
    cookieStore.get("reway.dashboard.viewMode.groups")?.value,
    "card",
  );
  const rowContent = parseRowContent(
    cookieStore.get("reway.dashboard.rowContent")?.value,
  );
  const commandMode = parseCommandMode(
    cookieStore.get("reway.dashboard.commandMode")?.value,
  );
  const showNotesTodos = parseShowNotesTodos(
    cookieStore.get("reway.dashboard.showNotesTodos")?.value,
  );

  const paletteTheme = parsePaletteTheme(
    cookieStore.get("reway.dashboard.paletteTheme")?.value,
  );

  const layoutDensity = parseLayoutDensity(
    cookieStore.get("reway.dashboard.layoutDensity")?.value,
  );

  const folderHeaderTint = parseFolderHeaderTint(
    cookieStore.get("reway.dashboard.folderHeaderTint")?.value,
  );

  const [user, bookmarks, groups, notes, todos] = await Promise.all([
    getUser(),
    getBookmarks(),
    getGroups(),
    getNotes(),
    getTodos(),
  ]).catch((error) => {
    console.error("Failed to load dashboard:", error);
    throw error;
  });

  return (
    <ErrorBoundary>
      <div
        data-dashboard-root
        className={`h-dvh overflow-hidden bg-background text-foreground ${getPaletteThemeClassName(paletteTheme)}`}
      >
        <main className="mx-auto w-full px-4 py-6">
          <DashboardContent
            user={user}
            initialBookmarks={bookmarks}
            initialGroups={groups}
            initialNotes={notes}
            initialTodos={todos}
            initialViewModeAll={viewModeAll}
            initialShowNotesTodos={showNotesTodos}
            initialViewModeGroups={viewModeGroups}
            initialRowContent={rowContent}
            initialCommandMode={commandMode}
            initialPaletteTheme={paletteTheme}
            initialLayoutDensity={layoutDensity}
            initialFolderHeaderTint={folderHeaderTint}
          />
        </main>
      </div>
    </ErrorBoundary>
  );
}
