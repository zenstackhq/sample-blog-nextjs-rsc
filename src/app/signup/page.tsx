/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { hashSync } from "bcryptjs";
import type { NextPage } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "~/server/db";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const Signup: NextPage = () => {
  async function signup(formData: FormData) {
    "use server";

    const parsed = signupSchema.parse(Object.fromEntries(formData));

    try {
      const user = await db.user.create({
        data: {
          email: parsed.email,
          password: hashSync(parsed.password),
        },
      });
      console.log("User created:", user);
    } catch (err: any) {
      console.error(err);
      if (err.info?.prisma && err.info?.code === "P2002") {
        return { message: "User already exists" };
      } else {
        return { message: "An unknown error occurred" };
      }
    }

    redirect("/signin");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      <h1 className="text-5xl font-extrabold text-white">Sign up</h1>
      <form className="mt-16 flex flex-col gap-8 text-2xl" action={signup}>
        <div>
          <label htmlFor="email" className="inline-block w-32 text-white">
            Email
          </label>
          <input
            name="email"
            type="email"
            className="ml-4 w-72 rounded border p-2"
          />
        </div>
        <div>
          <label htmlFor="password" className="inline-block w-32 text-white ">
            Password
          </label>
          <input
            name="password"
            type="password"
            className="ml-4 w-72 rounded border p-2"
          />
        </div>
        <input
          type="submit"
          value="Create account"
          className="cursor-pointer rounded border border-gray-500 py-4 text-white"
        />
      </form>
      <div className="mt-2 text-base font-medium text-gray-300">
        Already have an account?{" "}
        <Link href="/signin" className="text-primary-700 underline">
          {" "}
          Login here{" "}
        </Link>
      </div>
    </div>
  );
};

export default Signup;
