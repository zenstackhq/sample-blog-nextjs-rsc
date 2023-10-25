"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export type AuthUser = { id: string; email?: string | null };

const Welcome = ({ user }: { user: AuthUser }) => {
  const router = useRouter();

  async function onSignout() {
    await signOut({ redirect: false });
    router.push("/signin");
  }
  return (
    <div className="flex gap-4">
      <h3 className="text-lg">Welcome back, {user?.email}</h3>
      <button className="text-gray-300 underline" onClick={onSignout}>
        Signout
      </button>
    </div>
  );
};

export default Welcome;
