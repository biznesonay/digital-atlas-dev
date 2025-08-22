import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string
      role: "SUPER_ADMIN" | "EDITOR"
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: "SUPER_ADMIN" | "EDITOR"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: "SUPER_ADMIN" | "EDITOR"
  }
}