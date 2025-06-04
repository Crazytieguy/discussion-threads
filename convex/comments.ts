import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

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

export const listWithReplies = query({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, { postId }) => {
    // Get top-level comments (direct replies to the post)
    const topLevelComments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .collect();

    // Recursively build comment tree
    const buildCommentTree = async (comment: Doc<"comments">): Promise<any> => {
      const author: Doc<"users"> | null = await ctx.db.get(comment.authorId);
      const replies = await ctx.db
        .query("comments")
        .withIndex("by_parent_comment", (q) => q.eq("parentCommentId", comment._id))
        .collect();

      const repliesWithNesting = await Promise.all(
        replies.map((reply) => buildCommentTree(reply))
      );

      return {
        ...comment,
        author: author ? { name: author.name } : { name: "Unknown" },
        replies: repliesWithNesting,
      };
    };

    return await Promise.all(
      topLevelComments.map(comment => buildCommentTree(comment))
    );
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
      // For replies, inherit the postId from the parent comment's root
      if (!postId) {
        postId = parentComment.postId;
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