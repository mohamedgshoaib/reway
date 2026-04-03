import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const MAX_VISIT_BATCH_SIZE = 500;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

function parseBookmarkIds(payload: unknown): string[] {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("bookmarkIds" in payload) ||
    !Array.isArray(payload.bookmarkIds)
  ) {
    return [];
  }

  return payload.bookmarkIds
    .map((bookmarkId) =>
      typeof bookmarkId === "string" ? bookmarkId.trim() : "",
    )
    .filter((bookmarkId): bookmarkId is string =>
      bookmarkId.length > 0 && isUuid(bookmarkId),
    );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const bookmarkIds = parseBookmarkIds(payload);

  const uniqueBookmarkIds = Array.from(new Set(bookmarkIds)).slice(
    0,
    MAX_VISIT_BATCH_SIZE,
  );

  if (uniqueBookmarkIds.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  const { error } = await supabaseAdmin.rpc("increment_bookmark_visits", {
    p_user_id: user.id,
    p_bookmark_ids: uniqueBookmarkIds,
  });

  if (error) {
    console.error("Failed to record bookmark visits:", error);
    return NextResponse.json(
      { error: "Failed to record bookmark visits" },
      { status: 500 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
