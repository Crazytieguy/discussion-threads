import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface CreateCommentFormProps {
  postId: Id<"posts">;
  parentCommentId?: Id<"comments">;
  onSuccess?: () => void;
}

export function CreateCommentForm({ postId, parentCommentId, onSuccess }: CreateCommentFormProps) {
  const { user } = useUser();
  const createComment = useMutation(api.comments.create);
  const ensureUser = useMutation(api.users.ensureUser);

  const form = useForm({
    defaultValues: {
      content: "",
    },
    onSubmit: async ({ value }) => {
      if (!user) return;
      
      const dbUser = await ensureUser();
      if (!dbUser) return;
      
      await createComment({
        content: value.content,
        authorId: dbUser._id,
        postId: parentCommentId ? undefined : postId,
        parentCommentId,
      });
      
      form.reset();
      onSuccess?.();
    },
  });

  return (
    <div className="not-prose">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-3"
      >
        <form.Field
          name="content"
          validators={{
            onChange: ({ value }) =>
              !value ? "Comment is required" : value.length < 3 ? "Comment must be at least 3 characters" : undefined,
          }}
        >
          {(field) => (
            <div className="form-control">
              <textarea
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Write a comment..."
                className="textarea textarea-bordered textarea-sm"
                rows={2}
              />
              {field.state.meta.errors && (
                <span className="label-text-alt text-error mt-1">
                  {field.state.meta.errors}
                </span>
              )}
            </div>
          )}
        </form.Field>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!form.state.canSubmit || form.state.isSubmitting}
            className="btn btn-primary btn-sm"
          >
            {form.state.isSubmitting ? "Posting..." : "Post Comment"}
          </button>
        </div>
      </form>
    </div>
  );
}