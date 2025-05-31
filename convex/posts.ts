import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ConvexError } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("posts")
      .order("desc")
      .collect();

    const postsWithAuthors = await Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        return {
          ...post,
          author: author ? { name: author.name } : { name: "Unknown" },
        };
      })
    );

    return postsWithAuthors;
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    authorId: v.id("users"),
  },
  handler: async (ctx, { title, content, authorId }) => {
    if (!title.trim() || !content.trim()) {
      throw new ConvexError("Title and content are required");
    }

    const author = await ctx.db.get(authorId);
    if (!author) {
      throw new ConvexError("Author not found");
    }

    return await ctx.db.insert("posts", {
      title: title.trim(),
      content: content.trim(),
      authorId,
    });
  },
});