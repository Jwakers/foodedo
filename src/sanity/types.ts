export interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt?: string;
  excerpt?: string;
  mainImage?: { asset?: { _ref: string }; [key: string]: unknown };
  body?: unknown[];
}

export interface PostListItem
  extends Pick<Post, "_id" | "title" | "slug" | "publishedAt" | "excerpt"> {
  mainImage?: Post["mainImage"];
}
