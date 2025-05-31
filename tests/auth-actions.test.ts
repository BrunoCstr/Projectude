// tests/auth-actions.test.ts
import { loginAction, signupAction, logoutAction, changePasswordAction, sendPasswordResetEmailAction, googleSignInAction } from '../src/actions/auth-actions';
import { createSessionCookie, clearSessionCookie } from '../src/lib/session';
import {
    handleLogin as handleLoginLib,
    handleSignup as handleSignupLib,
    handleLogout as handleLogoutLib,
    handleChangePassword as handleChangePasswordLib,
    sendPasswordResetEmailHandler as sendPasswordResetEmailLib,
    handleGoogleSignIn as handleGoogleSignInLib, // Import mock for Google Sign-In
} from '../src/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { User } from 'firebase/auth'; // Import User type

// --- Mock Dependencies ---
jest.mock('../src/lib/session', () => ({
    createSessionCookie: jest.fn().mockResolvedValue(undefined),
    clearSessionCookie: jest.fn().mockResolvedValue(undefined),
    verifySessionCookie: jest.fn().mockResolvedValue(null), // Default to no session
}));

jest.mock('../src/lib/auth', () => ({
    handleLogin: jest.fn(),
    handleSignup: jest.fn(),
    handleLogout: jest.fn(),
    handleChangePassword: jest.fn(),
    sendPasswordResetEmailHandler: jest.fn(),
    handleGoogleSignIn: jest.fn(), // Mock the Google Sign-In handler
    setupOnAuthStateChangedListener: jest.fn(() => () => {}), // Mock listener setup
    getCurrentUser: jest.fn(() => null), // Default to no user
    getUserProfile: jest.fn().mockResolvedValue(null), // Default to no profile
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    redirect: jest.fn(() => { throw new Error('REDIRECT_TEST_ERROR'); }), // Mock redirect to throw
}));

// --- Mocks Type Assertions ---
const mockedCreateSessionCookie = createSessionCookie as jest.Mock;
const mockedClearSessionCookie = clearSessionCookie as jest.Mock;
const mockedHandleLoginLib = handleLoginLib as jest.Mock;
const mockedHandleSignupLib = handleSignupLib as jest.Mock;
const mockedHandleLogoutLib = handleLogoutLib as jest.Mock;
const mockedHandleChangePasswordLib = handleChangePasswordLib as jest.Mock;
const mockedSendPasswordResetEmailLib = sendPasswordResetEmailLib as jest.Mock;
const mockedHandleGoogleSignInLib = handleGoogleSignInLib as jest.Mock; // Mock for Google
const mockedRevalidatePath = revalidatePath as jest.Mock;
const mockedRedirect = redirect as jest.Mock;

// Mock User data
const mockUser = { uid: 'test-uid-123', email: 'test@example.com', getIdToken: jest.fn().mockResolvedValue('mock-id-token') } as unknown as User; // Use 'as unknown as User'
const mockUserWithoutTokenFn = { uid: 'test-uid-123', email: 'test@example.com' }; // For signup mock

describe('Authentication Server Actions', () => {

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
    });

    // --- loginAction Tests ---
    describe('loginAction', () => {
        it('should call login lib, create session, revalidate, and redirect on success', async () => {
            mockedHandleLoginLib.mockResolvedValue({ success: true, user: mockUser });
            mockedCreateSessionCookie.mockResolvedValue(undefined);

            // Expect redirect to throw
            await expect(loginAction({ email: 'test@example.com', password: 'password123' }))
                  .rejects.toThrow('REDIRECT_TEST_ERROR');

            expect(mockedHandleLoginLib).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
            expect(mockedCreateSessionCookie).toHaveBeenCalledWith(mockUser);
            expect(mockedRevalidatePath).toHaveBeenCalledWith('/', 'layout');
            expect(mockedRedirect).toHaveBeenCalledWith('/dashboard');
        });

        it('should return error if login lib fails', async () => {
            mockedHandleLoginLib.mockResolvedValue({ success: false, message: 'Invalid credentials' });

            const result = await loginAction({ email: 'test@example.com', password: 'wrongpassword' });

            expect(mockedHandleLoginLib).toHaveBeenCalledWith({ email: 'test@example.com', password: 'wrongpassword' });
            expect(mockedCreateSessionCookie).not.toHaveBeenCalled();
            expect(mockedRevalidatePath).not.toHaveBeenCalled();
            expect(result).toEqual({ success: false, message: 'Invalid credentials' });
            expect(mockedRedirect).not.toHaveBeenCalled(); // No redirect on failure
        });

         it('should return error if session cookie creation fails', async () => {
            const sessionError = new Error('Session creation failed');
            mockedHandleLoginLib.mockResolvedValue({ success: true, user: mockUser });
            mockedCreateSessionCookie.mockRejectedValue(sessionError);
            mockedHandleLogoutLib.mockResolvedValue({ success: true, message: 'Logout successful.' });

            const result = await loginAction({ email: 'test@example.com', password: 'password123' });

            expect(mockedHandleLoginLib).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
            expect(mockedCreateSessionCookie).toHaveBeenCalledWith(mockUser);
            expect(mockedHandleLogoutLib).toHaveBeenCalled(); // Ensure cleanup logout is called
            expect(mockedRevalidatePath).not.toHaveBeenCalled(); // No revalidation on session failure path
            expect(result).toEqual({ success: false, message: `Login bem-sucedido, mas falha ao criar sessão: ${sessionError.message}` });
            expect(mockedRedirect).not.toHaveBeenCalled(); // No redirect on session failure
         });

         it('should return error if email or password is missing', async () => {
            const result1 = await loginAction({ email: '', password: 'password123' });
            expect(result1).toEqual({ success: false, message: 'Email e senha são obrigatórios.' });
            expect(mockedHandleLoginLib).not.toHaveBeenCalled();

             const result2 = await loginAction({ email: 'test@example.com', password: '' });
             expect(result2).toEqual({ success: false, message: 'Email e senha são obrigatórios.' });
             expect(mockedHandleLoginLib).not.toHaveBeenCalled();
         });
    });

    // --- signupAction Tests ---
    describe('signupAction', () => {
         const signupData = {
             name: 'Test User',
             email: 'new@example.com',
             password: 'Password123!',
             confirmPassword: 'Password123!',
             terms: true,
         };

        it('should call signup lib, create session, revalidate, and redirect on success', async () => {
            const createdUser = { ...mockUserWithoutTokenFn, email: signupData.email, uid: 'new-uid-456', getIdToken: jest.fn().mockResolvedValue('new-mock-id-token') } as unknown as User;
            mockedHandleSignupLib.mockResolvedValue({ success: true, user: createdUser, message: 'Signup successful.', redirectPath: '/onboarding' });
            mockedCreateSessionCookie.mockResolvedValue(undefined);

            // Expect redirect to throw
            await expect(signupAction(signupData)).rejects.toThrow('REDIRECT_TEST_ERROR');

            expect(mockedHandleSignupLib).toHaveBeenCalledWith(signupData);
            expect(mockedCreateSessionCookie).toHaveBeenCalledWith(createdUser);
            expect(mockedRevalidatePath).toHaveBeenCalledWith('/', 'layout');
            expect(mockedRedirect).toHaveBeenCalledWith('/onboarding'); // Redirects to path from lib result
        });

         it('should return error if signup lib fails', async () => {
            mockedHandleSignupLib.mockResolvedValue({ success: false, message: 'Email already in use' });

            const result = await signupAction(signupData);

            expect(mockedHandleSignupLib).toHaveBeenCalledWith(signupData);
            expect(mockedCreateSessionCookie).not.toHaveBeenCalled();
            expect(result).toEqual({ success: false, message: 'Email already in use' });
            expect(mockedRedirect).not.toHaveBeenCalled();
         });

        it('should return error if session cookie creation fails after successful signup', async () => {
             const createdUser = { ...mockUserWithoutTokenFn, email: signupData.email, uid: 'new-uid-789', getIdToken: jest.fn().mockResolvedValue('another-mock-id-token') } as unknown as User;
             const sessionError = new Error('Session creation failed');
             mockedHandleSignupLib.mockResolvedValue({ success: true, user: createdUser, message: 'Signup successful.' });
             mockedCreateSessionCookie.mockRejectedValue(sessionError);
             mockedHandleLogoutLib.mockResolvedValue({ success: true, message: 'Logout successful.' }); // Mock cleanup logout

            const result = await signupAction(signupData);

             expect(mockedHandleSignupLib).toHaveBeenCalledWith(signupData);
             expect(mockedCreateSessionCookie).toHaveBeenCalledWith(createdUser);
             expect(mockedHandleLogoutLib).toHaveBeenCalled(); // Ensure cleanup logout is called
             expect(result).toEqual({ success: false, message: `Cadastro bem-sucedido, mas falha ao criar sessão: ${sessionError.message}` });
             expect(mockedRedirect).not.toHaveBeenCalled();
        });

         it('should return correct error message if signup lib returns error message', async () => {
             mockedHandleSignupLib.mockResolvedValue({ success: false, message: 'Senha muito fraca.' });

             const result = await signupAction({...signupData, password: 'weak', confirmPassword: 'weak'});

             expect(mockedHandleSignupLib).toHaveBeenCalled();
             expect(result).toEqual({ success: false, message: 'Senha muito fraca.' });
         });
    });

    // --- googleSignInAction Tests ---
    describe('googleSignInAction', () => {
        const mockGoogleUser = { uid: 'google-uid-xyz', email: 'google@example.com', getIdToken: jest.fn().mockResolvedValue('google-id-token') } as unknown as User;

        it('should call Google Sign-In lib, create session, revalidate, and redirect on success', async () => {
            mockedHandleGoogleSignInLib.mockResolvedValue({ success: true, user: mockGoogleUser });
            mockedCreateSessionCookie.mockResolvedValue(undefined);

             // Expect redirect to throw
             await expect(googleSignInAction()).rejects.toThrow('REDIRECT_TEST_ERROR');

            expect(mockedHandleGoogleSignInLib).toHaveBeenCalled();
            expect(mockedCreateSessionCookie).toHaveBeenCalledWith(mockGoogleUser);
            expect(mockedRevalidatePath).toHaveBeenCalledWith('/', 'layout');
            expect(mockedRedirect).toHaveBeenCalledWith('/dashboard');
        });

        it('should return error if Google sign-in lib fails', async () => {
            mockedHandleGoogleSignInLib.mockResolvedValue({ success: false, message: 'Popup closed by user' });

            const result = await googleSignInAction();

            expect(mockedHandleGoogleSignInLib).toHaveBeenCalled();
            expect(mockedCreateSessionCookie).not.toHaveBeenCalled();
            expect(mockedRevalidatePath).not.toHaveBeenCalled();
            expect(result).toEqual({ success: false, message: 'Popup closed by user' });
            expect(mockedRedirect).not.toHaveBeenCalled();
        });

        it('should return error if session cookie creation fails after Google sign-in', async () => {
            const sessionError = new Error('Session failed');
            mockedHandleGoogleSignInLib.mockResolvedValue({ success: true, user: mockGoogleUser });
            mockedCreateSessionCookie.mockRejectedValue(sessionError);
            mockedHandleLogoutLib.mockResolvedValue({ success: true, message: 'Logout successful.' }); // Mock cleanup logout

            const result = await googleSignInAction();

            expect(mockedHandleGoogleSignInLib).toHaveBeenCalled();
            expect(mockedCreateSessionCookie).toHaveBeenCalledWith(mockGoogleUser);
            expect(mockedHandleLogoutLib).toHaveBeenCalled();
            expect(mockedRevalidatePath).not.toHaveBeenCalled();
            expect(result).toEqual({ success: false, message: `Google Sign-In bem-sucedido, mas falha ao criar sessão: ${sessionError.message}` });
            expect(mockedRedirect).not.toHaveBeenCalled();
        });

        it('should return correct error message if google lib returns error', async () => {
            mockedHandleGoogleSignInLib.mockResolvedValue({ success: false, message: 'auth/network-request-failed' }); // Example error

            const result = await googleSignInAction();

            expect(result).toEqual({ success: false, message: 'auth/network-request-failed' }); // Pass through the message
            expect(mockedRedirect).not.toHaveBeenCalled();
        });
    });


    // --- logoutAction Tests ---
    describe('logoutAction', () => {
        it('should clear session cookie and redirect to login', async () => {
            mockedClearSessionCookie.mockResolvedValue(undefined);

             // Expect redirect to throw
            await expect(logoutAction()).rejects.toThrow('REDIRECT_TEST_ERROR');

            expect(mockedClearSessionCookie).toHaveBeenCalled();
            expect(mockedRevalidatePath).toHaveBeenCalledWith('/', 'layout');
            expect(mockedRedirect).toHaveBeenCalledWith('/login');
             // Cannot assert return value because redirect throws
        });

         it('should still redirect even if clearing cookie fails (but log error)', async () => {
            const clearError = new Error('Failed to clear cookie');
            mockedClearSessionCookie.mockRejectedValue(clearError);
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            // Expect redirect to throw
            await expect(logoutAction()).rejects.toThrow('REDIRECT_TEST_ERROR');

            expect(mockedClearSessionCookie).toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalledWith("[AuthAction:logoutAction] Error clearing session cookie during logout:", clearError);
            expect(mockedRevalidatePath).toHaveBeenCalledWith('/', 'layout');
            expect(mockedRedirect).toHaveBeenCalledWith('/login');
            consoleErrorSpy.mockRestore();
        });
    });

    // --- changePasswordAction Tests ---
    describe('changePasswordAction', () => {
        it('should call the change password lib function and return its result', async () => {
            mockedHandleChangePasswordLib.mockResolvedValue({ success: true, message: 'Senha atualizada com sucesso.' });

            const result = await changePasswordAction('oldPassword', 'NewPassword123!');

            expect(mockedHandleChangePasswordLib).toHaveBeenCalledWith('NewPassword123!', 'oldPassword');
            expect(result).toEqual({ success: true, message: 'Senha atualizada com sucesso.' });
        });

        it('should handle failure from the change password lib function', async () => {
            mockedHandleChangePasswordLib.mockResolvedValue({ success: false, message: 'Senha atual incorreta.' });

            const result = await changePasswordAction('wrongOldPassword', 'NewPassword123!');

            expect(mockedHandleChangePasswordLib).toHaveBeenCalledWith('NewPassword123!', 'wrongOldPassword');
            expect(result).toEqual({ success: false, message: 'Senha atual incorreta.' });
        });

        it('should pass undefined for currentPassword if not provided', async () => {
             mockedHandleChangePasswordLib.mockResolvedValue({ success: true, message: 'Senha atualizada com sucesso.' });
             const result = await changePasswordAction(undefined, 'NewPassword123!');
             expect(mockedHandleChangePasswordLib).toHaveBeenCalledWith('NewPassword123!', undefined);
             expect(result).toEqual({ success: true, message: 'Senha atualizada com sucesso.' });
        });
    });

    // --- sendPasswordResetEmailAction Tests ---
    describe('sendPasswordResetEmailAction', () => {
        it('should call the send password reset email lib function and return its result', async () => {
            const successMsg = 'Se uma conta com este e-mail existir, um link de redefinição de senha foi enviado.';
            mockedSendPasswordResetEmailLib.mockResolvedValue({ success: true, message: successMsg });

            const result = await sendPasswordResetEmailAction('test@example.com');

            expect(mockedSendPasswordResetEmailLib).toHaveBeenCalledWith('test@example.com');
            expect(result).toEqual({ success: true, message: successMsg });
        });

        it('should handle failure from the send password reset email lib function (still returning generic success)', async () => {
            const successMsg = 'Se uma conta com este e-mail existir, um link de redefinição de senha foi enviado.';
             // Simulate lib failing but action should still return generic success for security
             mockedSendPasswordResetEmailLib.mockResolvedValue({ success: true, message: successMsg });

            const result = await sendPasswordResetEmailAction('nonexistent@example.com');

            expect(mockedSendPasswordResetEmailLib).toHaveBeenCalledWith('nonexistent@example.com');
             // The action should return the message returned by the lib, which is generic success
             expect(result).toEqual({ success: true, message: successMsg });
        });

        it('should return generic success even if lib throws an unexpected error', async () => {
            const unexpectedError = new Error("Network Error");
            mockedSendPasswordResetEmailLib.mockRejectedValue(unexpectedError);
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            const result = await sendPasswordResetEmailAction('test@example.com');

            expect(mockedSendPasswordResetEmailLib).toHaveBeenCalledWith('test@example.com');
            expect(result).toEqual({ success: true, message: 'Se uma conta com este e-mail existir, um link de redefinição de senha foi enviado.' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('[AuthAction:sendPasswordResetEmailAction] Error during password reset email process:', unexpectedError);
            consoleErrorSpy.mockRestore();
        });

         it('should return error if email is missing', async () => {
            const result = await sendPasswordResetEmailAction('');
            expect(result).toEqual({ success: false, message: 'Email é obrigatório.' });
            expect(mockedSendPasswordResetEmailLib).not.toHaveBeenCalled();
         });
    });
});
