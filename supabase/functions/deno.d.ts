// Editor-only shims so the project's Vite tsconfig doesn't red-underline Deno
// edge code. Not referenced by the root tsconfig.

declare namespace Deno {
  export const env: {
    get(key: string): string | undefined;
  };
  export function serve(
    handler: (req: Request) => Response | Promise<Response>,
  ): void;
}

declare module "npm:@supabase/supabase-js@2" {
  export * from "@supabase/supabase-js";
}
