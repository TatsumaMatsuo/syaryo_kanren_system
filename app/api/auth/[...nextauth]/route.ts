import NextAuth, { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import { getBaseRecords } from "@/lib/lark-client";
import { LARK_TABLES, EMPLOYEE_FIELDS } from "@/lib/lark-tables";

// メールアドレスから社員番号を取得
async function getEmployeeIdByEmail(email: string): Promise<string | null> {
  try {
    const response = await getBaseRecords(LARK_TABLES.EMPLOYEES, {
      filter: `CurrentValue.[${EMPLOYEE_FIELDS.email}]="${email}"`,
    });
    const employee = response.data?.items?.[0];
    if (employee?.fields?.[EMPLOYEE_FIELDS.employee_id]) {
      return employee.fields[EMPLOYEE_FIELDS.employee_id] as string;
    }
    return null;
  } catch (error) {
    console.error("Failed to get employee_id by email:", error);
    return null;
  }
}

const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "lark",
      name: "Lark (Feishu)",
      type: "oauth",
      wellKnown: undefined,
      authorization: {
        url: "https://open.feishu.cn/open-apis/authen/v1/index",
        params: {
          app_id: process.env.LARK_OAUTH_CLIENT_ID,
          redirect_uri: process.env.LARK_OAUTH_REDIRECT_URI,
        },
      },
      token: {
        url: "https://open.feishu.cn/open-apis/authen/v1/access_token",
        async request({ params, provider }) {
          // Larkの認証コードを使ってアクセストークンを取得
          const response = await fetch(
            "https://open.feishu.cn/open-apis/authen/v1/access_token",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                grant_type: "authorization_code",
                code: params.code,
                app_id: process.env.LARK_OAUTH_CLIENT_ID,
                app_secret: process.env.LARK_OAUTH_CLIENT_SECRET,
              }),
            }
          );

          const tokens = await response.json();

          if (tokens.code !== 0) {
            throw new Error(`Lark auth error: ${tokens.msg}`);
          }

          return {
            tokens: {
              access_token: tokens.data.access_token,
              refresh_token: tokens.data.refresh_token,
              expires_in: tokens.data.expires_in,
            },
          };
        },
      },
      userinfo: {
        async request({ tokens }) {
          // アクセストークンを使ってユーザー情報を取得
          const response = await fetch(
            "https://open.feishu.cn/open-apis/authen/v1/user_info",
            {
              headers: {
                Authorization: `Bearer ${tokens.access_token}`,
              },
            }
          );

          const userInfo = await response.json();

          if (userInfo.code !== 0) {
            throw new Error(`Lark userinfo error: ${userInfo.msg}`);
          }

          return userInfo.data;
        },
      },
      clientId: process.env.LARK_OAUTH_CLIENT_ID,
      clientSecret: process.env.LARK_OAUTH_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.open_id || profile.union_id,
          name: profile.name,
          email: profile.email || profile.enterprise_email,
          image: profile.avatar_url || profile.avatar_thumb,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        // メールアドレスから社員番号を取得
        let employeeId: string | null = null;
        if (user.email) {
          employeeId = await getEmployeeIdByEmail(user.email);
          console.log(`[Auth] Got employee_id for ${user.email}: ${employeeId}`);
        }
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          userId: user.id,
          employeeId: employeeId,
          email: user.email,
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
          employeeId: token.employeeId as string | null,
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
