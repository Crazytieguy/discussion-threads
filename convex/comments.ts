import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ConvexError } from "convex/values";

export const listByPost = query({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, { postId }) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .collect();

    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);
        return {
          ...comment,
          author: author ? { name: author.name } : { name: "Unknown" },
        };
      })
    );

    return commentsWithAuthors;
  },
});

export const listByParentComment = query({
  args: {
    parentCommentId: v.id("comments"),
  },
  handler: async (ctx, { parentCommentId }) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_parent_comment", (q) => q.eq("parentCommentId", parentCommentId))
      .collect();

    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);
        return {
          ...comment,
          author: author ? { name: author.name } : { name: "Unknown" },
        };
      })
    );

    return commentsWithAuthors;
  },
});

export const create = mutation({
  args: {
    content: v.string(),
    authorId: v.id("users"),
    postId: v.optional(v.id("posts")),
    parentCommentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, { content, authorId, postId, parentCommentId }) => {
    if (!content.trim()) {
      throw new ConvexError("Content is required");
    }

    if (!postId && !parentCommentId) {
      throw new ConvexError("Either postId or parentCommentId is required");
    }

    const author = await ctx.db.get(authorId);
    if (!author) {
      throw new ConvexError("Author not found");
    }

    if (postId) {
      const post = await ctx.db.get(postId);
      if (!post) {
        throw new ConvexError("Post not found");
      }
    }

    if (parentCommentId) {
      const parentComment = await ctx.db.get(parentCommentId);
      if (!parentComment) {
        throw new ConvexError("Parent comment not found");
      }
    }

    return await ctx.db.insert("comments", {
      content: content.trim(),
      authorId,
      postId,
      parentCommentId,
    });
  },
});