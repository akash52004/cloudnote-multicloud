import { NextResponse } from "next/server";
import { getPool } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await getPool().query(
      "SELECT id, title, content, created_at FROM notes ORDER BY created_at DESC LIMIT 100"
    );
    return NextResponse.json({ notes: result.rows });
  } catch (error) {
    console.error("GET /api/notes:", error.message);
    return NextResponse.json({ error: "Unable to retrieve notes. Check database configuration." }, { status: 503 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required." }, { status: 400 });
    }
    if (title.length > 120 || content.length > 5000) {
      return NextResponse.json({ error: "Title or content is too long." }, { status: 400 });
    }
    const result = await getPool().query(
      "INSERT INTO notes (title, content) VALUES ($1, $2) RETURNING id, title, content, created_at",
      [title, content]
    );
    return NextResponse.json({ note: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/notes:", error.message);
    return NextResponse.json({ error: "Unable to save note. Check database configuration." }, { status: 503 });
  }
}

export async function DELETE(request) {
  try {
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ error: "A valid note id is required." }, { status: 400 });
    }
    const result = await getPool().query("DELETE FROM notes WHERE id = $1 RETURNING id", [id]);
    if (result.rowCount === 0) return NextResponse.json({ error: "Note not found." }, { status: 404 });
    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    console.error("DELETE /api/notes:", error.message);
    return NextResponse.json({ error: "Unable to delete note. Check database configuration." }, { status: 503 });
  }
}
