import { SignInButton } from "@clerk/clerk-react";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { CreatePostForm } from "@/components/CreatePostForm";
import { CreateCommentForm } from "@/components/CreateCommentForm";

const postsQueryOptions = convexQuery(api.posts.list, {});

export const Route = createFileRoute("/")({
  loader: async ({ context: { queryClient } }) =>
    await queryClient.ensureQueryData(postsQueryOptions),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-center mb-8">Discussion Threads</h1>

      <Unauthenticated>
        <div className="text-center">
          <p>Sign in to participate in discussions.</p>
          <div className="not-prose mt-4">
            <SignInButton mode="modal">
              <button className="btn btn-primary btn-lg">Get Started</button>
            </SignInButton>
          </div>
        </div>
      </Unauthenticated>

      <Authenticated>
        <PostsList />
      </Authenticated>
    </div>
  );
}

function PostsList() {
  const { data: posts } = useSuspenseQuery(postsQueryOptions);

  return (
    <>
      <CreatePostForm />
      
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="not-prose">
            <div className="p-8 bg-base-200 rounded-lg text-center">
              <p className="opacity-70">No posts yet. Be the first to start a discussion!</p>
            </div>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))
        )}
      </div>
    </>
  );
}

function PostCard({ post }: { post: any }) {
  const [showComments, setShowComments] = useState(false);
  const commentsQueryOptions = convexQuery(api.comments.listByPost, { postId: post._id });
  const { data: comments } = useSuspenseQuery(commentsQueryOptions);

  return (
    <div className="not-prose">
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title">{post.title}</h2>
          <p className="text-base-content/80 mb-4">{post.content}</p>
          
          <div className="flex items-center justify-between text-sm text-base-content/60">
            <span>By {post.author.name}</span>
            <span>{new Date(post._creationTime).toLocaleDateString()}</span>
          </div>
          
          <div className="card-actions justify-start mt-4">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowComments(!showComments)}
            >
              {showComments ? 'Hide' : 'Show'} Comments ({comments.length})
            </button>
          </div>
          
          {showComments && (
            <div className="mt-4 border-t pt-4">
              <div className="mb-4">
                <CreateCommentForm postId={post._id} />
              </div>
              <CommentsList postId={post._id} comments={comments} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CommentsList({ postId, comments }: { postId: string; comments: any[] }) {
  return (
    <div className="space-y-3">
      {comments.length === 0 ? (
        <p className="text-base-content/60 text-sm">No comments yet.</p>
      ) : (
        comments.map((comment) => (
          <CommentCard key={comment._id} comment={comment} />
        ))
      )}
    </div>
  );
}

function CommentCard({ comment }: { comment: any }) {
  return (
    <div className="bg-base-200 rounded-lg p-4">
      <p className="mb-2">{comment.content}</p>
      <div className="flex items-center justify-between text-xs text-base-content/60">
        <span>By {comment.author.name}</span>
        <span>{new Date(comment._creationTime).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
