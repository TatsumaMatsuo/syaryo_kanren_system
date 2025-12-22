import NextAuth, { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "lark",
      name: "Lark",
      type: "oauth",
      authorization: {
        url: "https://open.feishu.cn/open-apis/authen/v1/index",
        params: {
          app_id: process.env.LARK_OAUTH_CLIENT_ID,
          redirect_uri: process.env.LARK_OAUTH_REDIRECT_URI,
          state: "STATE",
        },
      },
      token: {
        url: "https://open.feishu.cn/open-apis/authen/v1/access_token",
      },
      userinfo: {
        url: "https://open.feishu.cn/open-apis/authen/v1/user_info",
      },
      clientId: process.env.LARK_OAUTH_CLIENT_ID,
      clientSecret: process.env.LARK_OAUTH_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.open_id,
          name: profile.name,
          email: profile.email,
          image: profile.avatar_url,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          userId: user.id,
        };
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.userId as string,
        },
        accessToken: token.accessToken as string,
      };
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
