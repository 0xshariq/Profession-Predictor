import NextAuth from "next-auth";
import { authOptions } from "./options";

// Create a NextAuth handler using the authOptions configuration
const handler = NextAuth(authOptions);

// Export the handler for both GET and POST requests
// This allows NextAuth to handle various authentication flows
export { handler as GET, handler as POST };

