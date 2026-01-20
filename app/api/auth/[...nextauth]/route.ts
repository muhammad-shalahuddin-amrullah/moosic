import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";

const handler = NextAuth({
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: { 
          scope: "user-read-email user-read-private user-top-read user-read-recently-played user-library-read playlist-read-private playlist-read-collaborative" 
        }
      }
    }),
  ],
  // ... (callbacks) ...
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };