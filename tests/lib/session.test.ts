// tests/lib/session.test.ts
import { createSessionCookie, clearSessionCookie, verifySessionCookie } from '../../src/lib/session';
import { cookies } from 'next/headers';
import type { User } from 'firebase/auth';

// --- Mock next/headers ---
// Store cookies in memory for testing
let cookieStore: Map<string, string> = new Map();

jest.mock('next/headers', () => ({
    cookies: jest.fn(() => ({
        set: jest.fn((name: string, value: string, options?: any) => {
            // console.log(`Mock cookies().set called: ${name}=${value}`);
            cookieStore.set(name, value);
        }),
        get: jest.fn((name: string) => {
            // console.log(`Mock cookies().get called for: ${name}`);
            const value = cookieStore.get(name);
            return value ? { name, value } : undefined;
        }),
        delete: jest.fn((name: string) => {
            // console.log(`Mock cookies().delete called for: ${name}`);
            return cookieStore.delete(name);
        }),
        // Add other methods if needed
        getAll: jest.fn(() => Array.from(cookieStore.entries()).map(([name, value]) => ({ name, value }))),
        has: jest.fn((name: string) => cookieStore.has(name)),
    })),
}));

// --- Mock Firebase Admin (if secure verification were tested) ---
// jest.mock('firebase-admin', () => ({
//   initializeApp: jest.fn(),
//   credential: {
//     cert: jest.fn(),
//   },
//   auth: () => ({
//     verifySessionCookie: jest.fn(),
//   }),
//   apps: [], // Start with no apps initialized
// }));
// const mockedVerifySessionCookie = admin.auth().verifySessionCookie as jest.Mock;


describe('Session Library Functions (lib/session.ts)', () => {
    const SESSION_COOKIE_NAME = 'projectude-session';
    const mockUser = {
        uid: 'test-session-uid',
        getIdToken: jest.fn().mockResolvedValue('mock.id.token'), // Mock the getIdToken method
    } as unknown as User; // Cast to User type

    beforeEach(() => {
        // Clear mocks and cookie store before each test
        jest.clearAllMocks();
        cookieStore.clear();
    });

    // --- createSessionCookie ---
    describe('createSessionCookie', () => {
        it('should set the session cookie with correct parameters', async () => {
            await createSessionCookie(mockUser);

            const cookieSetter = cookies().set as jest.Mock;
            expect(mockUser.getIdToken).toHaveBeenCalledWith(true);
            expect(cookieSetter).toHaveBeenCalledTimes(1);
            expect(cookieSetter).toHaveBeenCalledWith(
                SESSION_COOKIE_NAME,
                'mock.id.token',
                expect.objectContaining({
                    maxAge: expect.any(Number), // 5 days in seconds
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    path: '/',
                    sameSite: 'lax',
                })
            );
            // Check if the cookie was actually stored in our mock store
            expect(cookieStore.get(SESSION_COOKIE_NAME)).toBe('mock.id.token');
        });

         it('should throw an error if getIdToken fails', async () => {
            const tokenError = new Error('Failed to get ID token');
            (mockUser.getIdToken as jest.Mock).mockRejectedValueOnce(tokenError);

             await expect(createSessionCookie(mockUser)).rejects.toThrow('Could not create session.');
             expect(cookies().set).not.toHaveBeenCalled();
         });

         it('should throw an error if user object is invalid', async () => {
             await expect(createSessionCookie(null as any)).rejects.toThrow('Cannot create session for null user.');
             await expect(createSessionCookie(undefined as any)).rejects.toThrow('Cannot create session for null user.');
             expect(cookies().set).not.toHaveBeenCalled();
         });
    });

    // --- clearSessionCookie ---
    describe('clearSessionCookie', () => {
        it('should delete the session cookie', async () => {
            // Set a cookie first to ensure delete works
            cookieStore.set(SESSION_COOKIE_NAME, 'some-token');
            expect(cookieStore.has(SESSION_COOKIE_NAME)).toBe(true);

            await clearSessionCookie();

            const cookieDeleter = cookies().delete as jest.Mock;
            expect(cookieDeleter).toHaveBeenCalledTimes(1);
            expect(cookieDeleter).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
            expect(cookieStore.has(SESSION_COOKIE_NAME)).toBe(false);
        });

         it('should not throw error if deleting non-existent cookie', async () => {
            expect(cookieStore.has(SESSION_COOKIE_NAME)).toBe(false);
            await expect(clearSessionCookie()).resolves.toBeUndefined();
            expect(cookies().delete).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
         });
    });

    // --- verifySessionCookie ---
    describe('verifySessionCookie', () => {
        // --- !!! IMPORTANT !!! ---
        // These tests currently cover the INSECURE placeholder logic because Admin SDK is not mocked/used.
        // In a production setup, you would mock `admin.auth().verifySessionCookie` and test those paths.
        // ---

         const generateMockToken = (payload: object, expired = false): string => {
             const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64');
             const nowSeconds = Math.floor(Date.now() / 1000);
             const exp = expired ? nowSeconds - 3600 : nowSeconds + 3600; // Expired 1 hour ago or valid for 1 hour
             const fullPayload = { ...payload, iat: nowSeconds, exp };
             const payloadEncoded = Buffer.from(JSON.stringify(fullPayload)).toString('base64');
             const signature = 'insecure-mock-signature'; // Signature is not verified in placeholder
             return `${header}.${payloadEncoded}.${signature}`;
         };

         it('should return null if no session cookie exists', async () => {
            const result = await verifySessionCookie();
            expect(result).toBeNull();
            expect(cookies().get).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
         });

         it('(INSECURE CHECK) should return user UID if valid token exists', async () => {
             const validToken = generateMockToken({ user_id: 'verified-uid', email: 'valid@example.com' });
             cookieStore.set(SESSION_COOKIE_NAME, validToken);

             const result = await verifySessionCookie();

             expect(result).toEqual({ uid: 'verified-uid' });
             expect(cookies().delete).not.toHaveBeenCalled(); // Don't clear valid token
         });

         it('(INSECURE CHECK) should return null and clear cookie if token is expired', async () => {
             const expiredToken = generateMockToken({ user_id: 'expired-uid' }, true);
             cookieStore.set(SESSION_COOKIE_NAME, expiredToken);

             const result = await verifySessionCookie();

             expect(result).toBeNull();
             expect(cookies().get).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
             expect(cookies().delete).toHaveBeenCalledWith(SESSION_COOKIE_NAME); // Ensure expired cookie is cleared
         });

          it('(INSECURE CHECK) should return null and clear cookie if token format is invalid', async () => {
             const invalidToken = 'invalid-token-format';
             cookieStore.set(SESSION_COOKIE_NAME, invalidToken);

             const result = await verifySessionCookie();

             expect(result).toBeNull();
             expect(cookies().get).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
             expect(cookies().delete).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
          });

           it('(INSECURE CHECK) should return null and clear cookie if token payload is malformed', async () => {
              const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64');
              const invalidPayload = Buffer.from("this is not json").toString('base64');
              const malformedToken = `${header}.${invalidPayload}.sig`;
              cookieStore.set(SESSION_COOKIE_NAME, malformedToken);

              const result = await verifySessionCookie();

              expect(result).toBeNull();
              expect(cookies().get).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
              expect(cookies().delete).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
           });

           it('(INSECURE CHECK) should return null and clear cookie if payload lacks user_id or exp', async () => {
               const missingUidToken = generateMockToken({ email: 'test@example.com' }); // Missing user_id
               cookieStore.set(SESSION_COOKIE_NAME, missingUidToken);
               let result = await verifySessionCookie();
               expect(result).toBeNull();
               expect(cookies().delete).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
               cookieStore.clear(); // Clear for next part

                const missingExpToken = generateMockToken({ user_id: 'test-uid' });
                // Manually remove exp for testing
                const parts = missingExpToken.split('.');
                const payloadDecoded = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                delete payloadDecoded.exp;
                 const payloadEncoded = Buffer.from(JSON.stringify(payloadDecoded)).toString('base64');
                 const finalToken = `${parts[0]}.${payloadEncoded}.${parts[2]}`;
                cookieStore.set(SESSION_COOKIE_NAME, finalToken);

                result = await verifySessionCookie();
                expect(result).toBeNull();
                expect(cookies().delete).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
           });

        // --- Add tests for the SECURE Admin SDK path when implemented ---
        /*
        it('(SECURE CHECK) should return user UID when Admin SDK verifies the token', async () => {
            const validToken = 'valid-firebase-session-cookie';
            cookieStore.set(SESSION_COOKIE_NAME, validToken);
            mockedVerifySessionCookie.mockResolvedValue({ uid: 'admin-verified-uid' });

            const result = await verifySessionCookie(); // Assumes useAdminSdk = true inside the function

            expect(mockedVerifySessionCookie).toHaveBeenCalledWith(validToken, true);
            expect(result).toEqual({ uid: 'admin-verified-uid' });
            expect(cookies().delete).not.toHaveBeenCalled();
        });

        it('(SECURE CHECK) should return null and clear cookie when Admin SDK verification fails (expired)', async () => {
            const expiredToken = 'expired-firebase-session-cookie';
            cookieStore.set(SESSION_COOKIE_NAME, expiredToken);
            mockedVerifySessionCookie.mockRejectedValue({ code: 'auth/session-cookie-expired' });

            const result = await verifySessionCookie(); // Assumes useAdminSdk = true

            expect(mockedVerifySessionCookie).toHaveBeenCalledWith(expiredToken, true);
            expect(result).toBeNull();
            expect(cookies().delete).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
        });

         it('(SECURE CHECK) should return null and clear cookie when Admin SDK verification fails (invalid)', async () => {
            const invalidToken = 'invalid-firebase-session-cookie';
            cookieStore.set(SESSION_COOKIE_NAME, invalidToken);
            mockedVerifySessionCookie.mockRejectedValue({ code: 'auth/invalid-session-cookie' });

            const result = await verifySessionCookie(); // Assumes useAdminSdk = true

            expect(mockedVerifySessionCookie).toHaveBeenCalledWith(invalidToken, true);
            expect(result).toBeNull();
            expect(cookies().delete).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
         });
         */
    });
});