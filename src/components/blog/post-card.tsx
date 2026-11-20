import Link from "next/link";
import { formatPostDate } from "@/lib/blog";
import type { BlogPost } from "@/lib/blog-types";
import { coverSrcSet, coverUrl } from "@/lib/cloudinary/media";

/** A post in a grid: blog index, homepage "top posts", and "More articles". */
export function PostCard({ post, sizes }: { post: BlogPost; sizes: string }) {
  return (
    <Link
      href={`/blog/${post.slug}/`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-ink/10 bg-chalk transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      {post.cover ? (
        // eslint-disable-next-line @next/next/no-img-element -- Cloudinary serves sized, auto-format images
        <img
          src={coverUrl(post.cover.publicId, 960)}
          srcSet={coverSrcSet(post.cover.publicId)}
          sizes={sizes}
          alt={post.cover.alt}
          loading="lazy"
          decoding="async"
          className="aspect-[16/9] w-full object-cover"
        />
      ) : (
        <div className="aspect-[16/9] w-full bg-court-900" aria-hidden="true" />
      )}
      <div className="flex flex-1 flex-col p-6">
        {post.category ? <p className="eyebrow text-mat-deep">{post.category}</p> : null}
        <h3 className="mt-2 text-[1.3rem] font-extrabold leading-snug tracking-[-0.01em] text-ink group-hover:text-mat-deep">
          {post.title}
        </h3>
        <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed text-ink-soft">{post.excerpt}</p>
        <p className="mt-auto pt-5 text-[13px] text-ink-soft">
          {post.publishedAt ? formatPostDate(post.publishedAt) : null} · {post.readingMinutes} min read
        </p>
      </div>
    </Link>
  );
}
