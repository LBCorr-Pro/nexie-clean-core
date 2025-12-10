
import { type NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin-helpers';

/**
 * API Route for verifying the Firebase session cookie.
 * This is called by the middleware to securely verify the user's session
 * in a Node.js environment where Firebase Admin SDK is available.
 */
export async function POST(request: NextRequest) {
  const sessionCookie = await request.text();

  if (!sessionCookie) {
    return new NextResponse(JSON.stringify({ error: 'Session cookie not found.' }), {
      status: 400, 
    });
  }

  try {
    const adminAuth = getAdminAuth();
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true /** checkRevoked */);
    
    // The cookie is valid.
    return new NextResponse(JSON.stringify({ status: 'success', decodedClaims }), {
      status: 200,
    });
  } catch (error) {
    // The cookie is invalid, expired, revoked, etc.
    return new NextResponse(JSON.stringify({ error: 'Invalid session cookie.' }), {
      status: 401, // Unauthorized
    });
  }
}
