import { enhance } from "@zenstackhq/runtime";
import { type NextPage } from "next";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import SigninSignup from "~/components/SigninSignup";
import Welcome from "~/components/Welcome";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";

// Get an enhanced PrismaClient instance with access policy enforcement
async function getEnhancedDb() {
  const session = await getServerAuthSession();
  return enhance(db, {
    user: session?.user ? { id: session.user.id } : undefined,
  });
}

const createSchema = z.object({ name: z.string() });
async function create(formData: FormData) {
  "use server";

  const session = await getServerAuthSession();
  if (!session) {
    return { error: "not logged in" };
  }

  const parsed = createSchema.parse(Object.fromEntries(formData));
  const db = await getEnhancedDb();
  await db.post.create({
    data: {
      name: parsed.name,
      createdBy: { connect: { id: session?.user.id } },
    },
  });
  revalidatePath("/");
}

const togglePublishedSchema = z.object({ id: z.coerce.number() });
async function togglePublished(formData: FormData) {
  "use server";

  const parsed = togglePublishedSchema.parse(Object.fromEntries(formData));
  const db = await getEnhancedDb();
  const curr = await db.post.findUnique({ where: { id: parsed.id } });
  if (!curr) {
    return { error: "post not found" };
  }
  await db.post.update({
    where: { id: parsed.id },
    data: { published: !curr.published },
  });

  revalidatePath("/");
}

const deleteSchema = z.object({ id: z.coerce.number() });
async function deletePost(formData: FormData) {
  "use server";

  const parsed = deleteSchema.parse(Object.fromEntries(formData));
  const db = await getEnhancedDb();
  await db.post.delete({
    where: { id: parsed.id },
  });
  revalidatePath("/");
}

const Posts = async () => {
  const db = await getEnhancedDb();
  const posts = await db.post.findMany({
    include: { createdBy: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container flex flex-col text-white">
      <form action={create}>
        <input
          type="text"
          name="name"
          placeholder="Enter post name"
          className="mr-2 w-96 rounded border p-2 text-gray-800"
        />
        <input
          className="cursor-pointer rounded border border-white p-2 text-lg"
          type="submit"
          value="+ Create Post"
        />
      </form>

      <ul className="container mt-8 flex flex-col gap-2">
        {posts?.map((post) => (
          <li key={post.id} className="flex items-end justify-between gap-4">
            <p className={`text-2xl ${!post.published ? "text-gray-400" : ""}`}>
              {post.name}
              <span className="text-lg"> by {post.createdBy.email}</span>
            </p>
            <div className="flex w-32 justify-end gap-1 text-left">
              <form action={togglePublished}>
                <input type="hidden" name="id" value={post.id} />
                <input
                  className="cursor-pointer underline"
                  type="submit"
                  value={post.published ? "Unpublish" : "Publish"}
                />
              </form>
              <form action={deletePost}>
                <input type="hidden" name="id" value={post.id} />
                <input
                  className="cursor-pointer underline"
                  type="submit"
                  value="Delete"
                />
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

const Home: NextPage = async () => {
  const session = await getServerAuthSession();
  const user = session?.user;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 text-white">
        <h1 className="text-5xl font-extrabold">My Awesome Blog</h1>

        {user ? (
          // welcome & blog posts
          <div className="flex flex-col">
            <Welcome user={user} />
            <section className="mt-10">
              <Posts />
            </section>
          </div>
        ) : (
          // if not logged in
          <SigninSignup />
        )}
      </div>
    </main>
  );
};

export default Home;
