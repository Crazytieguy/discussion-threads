import { useForm } from "@tanstack/react-form";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";

export function CreatePostForm() {
  const { user } = useUser();
  const createPost = useMutation(api.posts.create);
  const ensureUser = useMutation(api.users.ensureUser);

  const form = useForm({
    defaultValues: {
      title: "",
      content: "",
    },
    onSubmit: async ({ value }) => {
      if (!user) return;
      
      const dbUser = await ensureUser();
      if (!dbUser) return;
      
      await createPost({
        title: value.title,
        content: value.content,
        authorId: dbUser._id,
      });
      
      form.reset();
    },
  });

  return (
    <div className="not-prose mb-8">
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title">Create New Post</h2>
          
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            <form.Field
              name="title"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Title is required" : value.length < 3 ? "Title must be at least 3 characters" : undefined,
              }}
            >
              {(field) => (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Title</span>
                  </label>
                  <input
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    type="text"
                    placeholder="Enter post title"
                    className="input input-bordered w-full"
                  />
                  {field.state.meta.errors && (
                    <span className="label-text-alt text-error mt-1">
                      {field.state.meta.errors}
                    </span>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field
              name="content"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Content is required" : value.length < 10 ? "Content must be at least 10 characters" : undefined,
              }}
            >
              {(field) => (
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Content</span>
                  </label>
                  <textarea
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="What's on your mind?"
                    className="textarea textarea-bordered h-24"
                    rows={4}
                  />
                  {field.state.meta.errors && (
                    <span className="label-text-alt text-error mt-1">
                      {field.state.meta.errors}
                    </span>
                  )}
                </div>
              )}
            </form.Field>

            <div className="card-actions justify-end">
              <button
                type="submit"
                disabled={!form.state.canSubmit || form.state.isSubmitting}
                className="btn btn-primary"
              >
                {form.state.isSubmitting ? "Creating..." : "Create Post"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}