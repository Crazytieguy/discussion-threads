import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema defines your data model for the database.
// For more information, see https://docs.convex.dev/database/schema
export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
  }).index("by_clerkId", ["clerkId"]),
  
  posts: defineTable({
    title: v.string(),
    content: v.string(),
    authorId: v.id("users"),
  }),
  
  comments: defineTable({
    content: v.string(),
    authorId: v.id("users"),
    postId: v.optional(v.id("posts")),
    parentCommentId: v.optional(v.id("comments")),
  })
    .index("by_post", ["postId"])
    .index("by_parent_comment", ["parentCommentId"]),
});
