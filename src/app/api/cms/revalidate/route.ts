import { revalidateTag, revalidatePath } from "next/cache";
import { createHmac, timingSafeEqual } from "node:crypto";

function verifySignature(secret: string, header: string | null, body: string): boolean {
    if (!secret || !header) return false;
    const parts = Object.fromEntries(header.split(",").map((p) => p.split("=")));
    const t = Number(parts.t);
    if (!Number.isFinite(t) || Math.abs(Date.now() / 1000 - t) > 300 || !parts.v1) return false;
    const expected = createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(parts.v1);
    return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
    const secret = process.env.CMS_WEBHOOK_SECRET;
    const body = await req.text();

    if (!verifySignature(secret ?? "", req.headers.get("x-cms-signature"), body)) {
        return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Pass { expire: 0 } for immediate cache expiration in Next.js 15/16
    try {
        (revalidateTag as any)("cms", { expire: 0 });
    } catch {
        (revalidateTag as any)("cms");
    }

    // Revalidate the blog layout and pages
    try {
        revalidatePath("/blog", "layout");
    } catch { }

    return Response.json({ ok: true, revalidated: true });
}