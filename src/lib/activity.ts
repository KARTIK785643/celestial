import { ACTIVITY_COLLECTION, getDb } from "@/lib/mongodb";
import { paginate, type Page } from "@/lib/paginate";

/** Everything the admin log records. */
export type ActivityAction =
  | "signed-in"
  | "sign-in-failed"
  | "signed-out"
  | "created"
  | "saved"
  | "published"
  | "unpublished"
  | "deleted";

export type ActivityEntry = {
  id: string;
  at: Date;
  /** The admin's username (for a failed sign-in, the username that was tried). */
  actor: string;
  action: ActivityAction;
  postId: string | null;
  postTitle: string | null;
  /** Extra context, e.g. the IP address of a sign-in. */
  detail: string | null;
};

declare global {
  var _cbaActivityIndex: Promise<unknown> | undefined;
}

async function activityCollection() {
  const col = (await getDb()).collection(ACTIVITY_COLLECTION);
  globalThis._cbaActivityIndex ??= col.createIndex({ at: -1 }).catch((error) => {
    globalThis._cbaActivityIndex = undefined;
    throw error;
  });
  await globalThis._cbaActivityIndex;
  return col;
}

/**
 * Records one admin action. Never throws: a failed log write must not fail the action itself
 * (the post is already saved by the time this runs), so errors only reach the server log.
 */
export async function logActivity(entry: {
  actor: string;
  action: ActivityAction;
  postId?: string;
  postTitle?: string;
  detail?: string;
}): Promise<void> {
  try {
    await (await activityCollection()).insertOne({
      at: new Date(),
      actor: entry.actor,
      action: entry.action,
      postId: entry.postId ?? null,
      postTitle: entry.postTitle ?? null,
      detail: entry.detail ?? null,
    });
  } catch (error) {
    console.error("[activity] could not record %s by %s", entry.action, entry.actor, error);
  }
}

/** Entries per page on /admin/activity. */
export const ACTIVITY_PAGE_SIZE = 50;

/** One page of the log, newest first. */
export async function getActivityPage(page: number): Promise<Page<ActivityEntry>> {
  return paginate(await activityCollection(), {}, { at: -1, _id: -1 }, page, ACTIVITY_PAGE_SIZE, (doc) => ({
    id: String(doc._id),
    at: doc.at instanceof Date ? doc.at : new Date(0),
    actor: String(doc.actor ?? ""),
    action: doc.action as ActivityAction,
    postId: typeof doc.postId === "string" ? doc.postId : null,
    postTitle: typeof doc.postTitle === "string" ? doc.postTitle : null,
    detail: typeof doc.detail === "string" ? doc.detail : null,
  }));
}
