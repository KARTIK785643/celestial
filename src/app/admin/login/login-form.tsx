"use client";

import { useActionState } from "react";
import { Field } from "@/components/forms/field";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={formAction} className="rounded-3xl border border-ink/10 bg-chalk p-7 shadow-sm md:p-9">
      <h1 className="text-[24px] font-extrabold tracking-[-0.02em] text-ink">Admin sign in</h1>

      <div className="mt-6 space-y-5">
        <Field
          label="Username"
          name="username"
          required
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="Your admin username"
          defaultValue={state.username}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Your password"
        />
      </div>

      {state.error ? (
        <p role="alert" className="mt-5 rounded-xl bg-red-50 px-3 py-2 text-[13.5px] text-red-700">
          {state.error}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="btn btn-primary mt-7 w-full justify-center disabled:opacity-60">
        Sign in
      </button>
    </form>
  );
}
