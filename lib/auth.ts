import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const resolvedDatabaseUrlPrefix = () => {
  const value =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.PRISMA_DATABASE_URL

  if (!value) return 'undefined'
  if (value.startsWith('postgres')) return 'postgres'
  if (value.startsWith('prisma+')) return 'prisma+'
  if (value.startsWith('file:')) return 'file'
  return value.slice(0, 10)
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('Auth authorize invoked', {
          email: credentials?.email
        })

        if (!credentials?.email || !credentials?.password) {
          console.log('Auth authorize: missing credentials')
          return null;
        }

        console.log('Auth authorize env snapshot', {
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          hasPostgresPrisma: !!process.env.POSTGRES_PRISMA_URL,
          resolvedDatabaseUrlPrefix: resolvedDatabaseUrlPrefix()
        })

        let user
        try {
          user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })
        } catch (error) {
          console.error('Auth authorize: error fetching user', {
            email: credentials.email,
            message: (error as Error).message
          })
          throw error
        }

        if (!user || !user.password) {
          console.log('Auth authorize: user not found or missing password', {
            email: credentials.email,
            found: !!user,
            hasPassword: !!user?.password
          });
          return null;
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password);

        console.log('Auth authorize: password comparison result', {
          email: user.email,
          passwordMatch
        });

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as any).isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    }
  }
};
