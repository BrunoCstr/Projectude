// tests/lib/auth.test.ts
import {
    handleLoginClient,
    handleSignupClient,
    handleLogoutClient,
    handleChangePasswordClient,
    sendPasswordResetEmailHandler,
    getUserProfile,
    handleGoogleSignInClient, // Use client handler
    callCreateOrUpdateUserFunction, // Import the helper for mocking
    // We won't directly test callCreateOrUpdateUserFunction here,
    // but we'll mock its call within the handlers that use it.
} from '../../src/lib/auth';
import { getInitializedAuth, getInitializedFirestore, getInitializedFunctions, getInitializedGoogleProvider, isFirebaseInitialized } from '../../src/lib/firebase'; // Import safe getters
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail, updatePassword, onAuthStateChanged, AuthErrorCodes, signInWithPopup, type User, type Auth } from 'firebase/auth';
import { doc, getDoc, FirestoreError } from 'firebase/firestore'; // Keep getDoc for getUserProfile test
import { httpsCallable, FunctionsError } from 'firebase/functions'; // Import Functions modules
import { passwordStrengthSchema } from '../../src/lib/schemas';

// --- Mock Firebase Modules ---
// Mock the SAFE GETTERS from firebase.ts
jest.mock('../../src/lib/firebase', () => {
    const mockAuth = { currentUser: null, config: { emulator: { enabled: true } } }; // Mock emulator config
    const mockFirestore = {};
    const mockFunctions = {};
    const mockGoogleProvider = {};
    return {
        isFirebaseInitialized: true, // Assume initialized for most tests
        getInitializedFirebaseApp: jest.fn(() => ({})), // Mock app object
        getInitializedAuth: jest.fn(() => mockAuth),
        getInitializedFirestore: jest.fn(() => mockFirestore),
        getInitializedStorage: jest.fn(() => ({})), // Mock storage if needed elsewhere
        getInitializedFunctions: jest.fn(() => mockFunctions), // Mock Functions service
        getInitializedGoogleProvider: jest.fn(() => mockGoogleProvider),
        connectFirebaseEmulators: jest.fn(), // Mock emulator connection
    };
});

// Mock actual Firebase SDK functions
jest.mock('firebase/auth', () => ({
    // We need to mock getAuth to be called by the *actual* Firebase SDK functions inside auth.ts
    getAuth: jest.fn(() => (global as any).mockFirebaseAuthInstance), // Will assign mock instance in beforeEach
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    updatePassword: jest.fn(),
    onAuthStateChanged: jest.fn(),
    signInWithPopup: jest.fn(),
    GoogleAuthProvider: jest.fn(), // Mock the constructor
    // Enum needs to be mocked directly
    AuthErrorCodes: {
        INVALID_EMAIL: 'auth/invalid-email',
        USER_DISABLED: 'auth/user-disabled',
        USER_DELETED: 'auth/user-not-found',
        INVALID_PASSWORD: 'auth/wrong-password',
        INVALID_LOGIN_CREDENTIALS: 'auth/invalid-credential',
        EMAIL_EXISTS: 'auth/email-already-in-use',
        WEAK_PASSWORD: 'auth/weak-password',
        CREDENTIAL_TOO_OLD_LOGIN_AGAIN: 'auth/requires-recent-login',
        TOO_MANY_ATTEMPTS_TRY_LATER: 'auth/too-many-requests',
        NETWORK_REQUEST_FAILED: 'auth/network-request-failed',
        POPUP_CLOSED_BY_USER: 'auth/popup-closed-by-user',
        ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL: 'auth/account-exists-with-different-credential',
        POPUP_BLOCKED: 'auth/popup-blocked',
        OPERATION_NOT_ALLOWED: 'auth/operation-not-allowed',
        MISSING_PASSWORD: 'auth/missing-password',
        INTERNAL_ERROR: 'auth/internal-error',
        CANCELLED_POPUP_REQUEST: 'auth/cancelled-popup-request',
    }
}));

jest.mock('firebase/firestore', () => ({
    getFirestore: jest.fn(() => (global as any).mockFirebaseFirestoreInstance),
    doc: jest.fn(),
    getDoc: jest.fn(),
    // No need to mock setDoc, serverTimestamp, writeBatch anymore as they are in Cloud Function
    FirestoreError: class MockFirestoreError extends Error {
        code: string;
        constructor(code: string, message: string) {
            super(message);
            this.code = code;
            this.name = 'FirestoreError';
        }
    },
}));

// Mock Firebase Functions client SDK
const mockHttpsCallable = jest.fn();
jest.mock('firebase/functions', () => ({
    getFunctions: jest.fn(() => (global as any).mockFirebaseFunctionsInstance),
    httpsCallable: jest.fn(() => mockHttpsCallable), // Return the mock callable function
    // Mock FunctionsError class (using Firebase v9+ structure)
    FirebaseFunctionsError: class MockFunctionsError extends Error {
        code: string;
        details?: any;
        constructor(code: string, message?: string, details?: any) {
            super(message || `Function failed with code: ${code}`);
            this.code = code;
            this.details = details;
            this.name = 'FirebaseFunctionsError';
        }
    },
}));


// --- Mock Implementations ---
const mockedSignIn = signInWithEmailAndPassword as jest.Mock;
const mockedCreateUser = createUserWithEmailAndPassword as jest.Mock;
const mockedSignOut = signOut as jest.Mock;
const mockedSendResetEmail = sendPasswordResetEmail as jest.Mock;
const mockedUpdatePassword = updatePassword as jest.Mock;
const mockedSignInWithPopup = signInWithPopup as jest.Mock;
const mockedGetDoc = getDoc as jest.Mock;
const mockedDoc = doc as jest.Mock;
// const mockedGetFunctions = getFunctions as jest.Mock; // Mock getFunctions if needed
const mockedHttpsCallableConstructor = httpsCallable as jest.Mock; // Mock the constructor for httpsCallable

// Mock Console for checking logs specifically in error cases
let consoleErrorSpy: jest.SpyInstance;
let consoleWarnSpy: jest.SpyInstance;
let consoleLogSpy: jest.SpyInstance;

beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterAll(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
});


describe('Auth Library Functions (lib/auth.ts)', () => {
    // Mock Firebase instances needed by the SDK functions
    const mockAuthInstance = { currentUser: null, config: { emulator: { enabled: true } } } as unknown as Auth;
    const mockFirestoreInstance = {};
    const mockFunctionsInstance = {};
    const mockGoogleProviderInstance = {};

    beforeEach(() => {
        jest.clearAllMocks();
        // Assign mock instances globally for firebase/auth and firebase/firestore imports
        (global as any).mockFirebaseAuthInstance = mockAuthInstance;
        (global as any).mockFirebaseFirestoreInstance = mockFirestoreInstance;
        (global as any).mockFirebaseFunctionsInstance = mockFunctionsInstance; // For getFunctions
        (global as any).mockFirebaseGoogleProviderInstance = mockGoogleProviderInstance; // For getGoogleProvider

        // Reset mock user state
        if (mockAuthInstance) {
            (mockAuthInstance as any).currentUser = null;
        }
        // Default mocks
        mockedGetDoc.mockResolvedValue({ exists: () => false, data: () => undefined });
        mockedDoc.mockImplementation((db, collection, id) => ({ id, path: `${collection}/${id}` }));
        // Default mock for the callable function
        mockHttpsCallable.mockResolvedValue({ data: { success: true, message: 'Cloud function executed successfully.' } });
        mockedHttpsCallableConstructor.mockImplementation(() => mockHttpsCallable); // Ensure constructor returns the mock
    });

    // --- handleLogin ---
    describe('handleLoginClient', () => {
        const mockUserCred = { user: { uid: 'login-uid', email: 'test@example.com', displayName: 'Login User', photoURL: null } as User };

        it('should log in successfully and call the update user Cloud Function', async () => {
            mockedSignIn.mockResolvedValue(mockUserCred);
            // mockHttpsCallable resolved by default

            const result = await handleLoginClient({ email: 'test@example.com', password: 'password123' });

            expect(mockedSignIn).toHaveBeenCalledWith(mockAuthInstance, 'test@example.com', 'password123');
            expect(mockedHttpsCallableConstructor).toHaveBeenCalledWith(mockFunctionsInstance, 'dbCreateOrUpdateFirestoreUser');
            expect(mockHttpsCallable).toHaveBeenCalledWith({}); // No name passed on login
            expect(result).toEqual({ success: true, message: 'Login successful.', user: mockUserCred.user });
            expect(consoleLogSpy).toHaveBeenCalledWith('[AuthLib:handleLoginClient] Login process finished with success.');
        });

        it('should handle Cloud Function failure after successful login', async () => {
             const functionError = new FirebaseFunctionsError('not-found', 'Function not found.');
             mockedSignIn.mockResolvedValue(mockUserCred);
             mockHttpsCallable.mockRejectedValue(functionError); // Simulate function call failing

             const result = await handleLoginClient({ email: 'test@example.com', password: 'password123' });

             expect(mockedSignIn).toHaveBeenCalled();
             expect(mockHttpsCallable).toHaveBeenCalled(); // Function was called
             expect(result.success).toBe(false);
             // Check for combined message from mapping the function error
             expect(result.message).toBe('Login bem-sucedido, mas falha ao atualizar o perfil. Recurso não encontrado durante cloud function call. Verifique o nome da função.');
             expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("[AuthLib:callCreateOrUpdateUserFunction] Firebase Functions call failed:"), expect.any(Error)); // Error is re-thrown
        });


        it('should handle invalid credentials error from signInWithEmailAndPassword', async () => {
            mockedSignIn.mockRejectedValue({ code: AuthErrorCodes.INVALID_LOGIN_CREDENTIALS });

            const result = await handleLoginClient({ email: 'test@example.com', password: 'wrong' });

            expect(mockedSignIn).toHaveBeenCalledWith(mockAuthInstance, 'test@example.com', 'wrong');
            expect(result).toEqual({ success: false, message: 'E-mail ou senha inválidos.' });
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('[AuthLib:handleLoginClient] *** Error during login process ***'));
            expect(mockHttpsCallable).not.toHaveBeenCalled(); // Cloud function should not be called
        });

        it('should handle network error during signInWithEmailAndPassword', async () => {
           mockedSignIn.mockRejectedValue({ code: AuthErrorCodes.NETWORK_REQUEST_FAILED });
           const result = await handleLoginClient({ email: 'test@example.com', password: 'password' });
           expect(result).toEqual({ success: false, message: 'Falha na conexão de rede ao tentar autenticar. Verifique sua conexão com a internet e tente novamente.' });
        });

        // Add other handleLogin error tests...
    });

    // --- handleSignup ---
    describe('handleSignupClient', () => {
        const validSignupData = {
            name: 'New User',
            email: 'newsignup@example.com',
            password: 'StrongPassword123!',
            confirmPassword: 'StrongPassword123!',
            terms: true,
        };
        // Mock user credential includes the delete function
        const mockUserCred = { user: { uid: 'signup-uid', email: validSignupData.email, photoURL: null, displayName: null, delete: jest.fn().mockResolvedValue(undefined) } as unknown as User };

        beforeEach(() => {
            mockedCreateUser.mockResolvedValue(mockUserCred);
            mockHttpsCallable.mockResolvedValue({ data: { success: true, message: 'Profile created' } }); // Default success for cloud function
            mockUserCred.user.delete.mockClear(); // Clear delete mock calls
        });

        it('should sign up successfully and call create user Cloud Function', async () => {
            const result = await handleSignupClient(validSignupData);

            expect(mockedCreateUser).toHaveBeenCalledWith(mockAuthInstance, validSignupData.email, validSignupData.password);
            expect(mockedHttpsCallableConstructor).toHaveBeenCalledWith(mockFunctionsInstance, 'dbCreateOrUpdateFirestoreUser');
            // Verify the name is passed to the cloud function
            expect(mockHttpsCallable).toHaveBeenCalledWith({ name: validSignupData.name });
            expect(result).toEqual({ success: true, message: 'Signup successful.', user: mockUserCred.user, redirectPath: '/onboarding' });
            expect(consoleLogSpy).toHaveBeenCalledWith('[AuthLib:handleSignupClient] Signup process completed successfully.');
        });

         it('should handle Cloud Function failure during signup and attempt to delete Auth user', async () => {
             const functionError = new FirebaseFunctionsError('internal', 'Internal function error.');
             mockHttpsCallable.mockRejectedValue(functionError); // Simulate function failure

             const result = await handleSignupClient(validSignupData);

             expect(mockedCreateUser).toHaveBeenCalled(); // Auth user created
             expect(mockHttpsCallable).toHaveBeenCalledWith({ name: validSignupData.name }); // Function was called
             expect(result.success).toBe(false);
             // Check for combined message
             expect(result.message).toBe('Falha na conexão com o banco de dados ao criar o perfil. Ocorreu um erro interno no servidor da função. Tente novamente mais tarde.');
             expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Attempting to delete orphaned Auth user'));
             expect(mockUserCred.user.delete).toHaveBeenCalled(); // Verify delete was called
         });

        it('should fail signup if email is already in use', async () => {
            mockedCreateUser.mockRejectedValue({ code: AuthErrorCodes.EMAIL_EXISTS });
            const result = await handleSignupClient(validSignupData);
            expect(result).toEqual({ success: false, message: 'Já existe uma conta com este endereço de e-mail.' });
            expect(mockedCreateUser).toHaveBeenCalled();
            expect(mockHttpsCallable).not.toHaveBeenCalled(); // Cloud function not called
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('[AuthLib:handleSignupClient] *** Error during signup process ***'));
        });

        it('should fail signup if password is weak (client-side)', async () => {
           const weakData = { ...validSignupData, password: 'weak', confirmPassword: 'weak' };
           const result = await handleSignupClient(weakData);
           expect(result.success).toBe(false);
           // Check if the message comes from the passwordStrengthSchema
           expect(result.message).toContain('A senha deve ter no mínimo 8 caracteres.');
           expect(mockedCreateUser).not.toHaveBeenCalled();
        });

        // Add other handleSignup failure tests...
    });

    // --- handleGoogleSignInClient ---
    describe('handleGoogleSignInClient', () => {
        const mockGoogleUser = { uid: 'google-uid', email: 'google@example.com', displayName: 'Google User', photoURL: 'google-photo.jpg' } as User;
        const mockGoogleResult = { user: mockGoogleUser };

        beforeEach(() => {
            mockedSignInWithPopup.mockResolvedValue(mockGoogleResult);
            mockHttpsCallable.mockResolvedValue({ data: { success: true } }); // Default success
        });

        it('should sign in with Google successfully and call update user Cloud Function', async () => {
            const result = await handleGoogleSignInClient();

            expect(mockedSignInWithPopup).toHaveBeenCalledWith(mockAuthInstance, mockGoogleProviderInstance);
            expect(mockedHttpsCallableConstructor).toHaveBeenCalledWith(mockFunctionsInstance, 'dbCreateOrUpdateFirestoreUser');
            // Pass displayName to the cloud function data
            expect(mockHttpsCallable).toHaveBeenCalledWith({ name: mockGoogleUser.displayName });
            expect(result).toEqual({ success: true, message: 'Google Sign-In successful.', user: mockGoogleUser });
            expect(consoleLogSpy).toHaveBeenCalledWith('[AuthLib:handleGoogleSignInClient] Google Sign-In process completed successfully.');
        });

        it('should handle Cloud Function failure after successful Google sign-in', async () => {
            const functionError = new FirebaseFunctionsError('unavailable', 'Service unavailable.');
            mockHttpsCallable.mockRejectedValue(functionError); // Simulate function failure

            const result = await handleGoogleSignInClient();

            expect(mockedSignInWithPopup).toHaveBeenCalled();
            expect(mockHttpsCallable).toHaveBeenCalledWith({ name: mockGoogleUser.displayName });
            expect(result.success).toBe(false);
            expect(result.message).toBe('Login com Google bem-sucedido, mas falha ao atualizar o perfil. O serviço está temporariamente indisponível. Tente novamente mais tarde.');
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("[AuthLib:callCreateOrUpdateFirestoreUser] Firebase Functions call failed:"), expect.any(Error));
        });

        it('should handle popup closed by user during Google sign-in', async () => {
            mockedSignInWithPopup.mockRejectedValue({ code: AuthErrorCodes.POPUP_CLOSED_BY_USER });
            const result = await handleGoogleSignInClient();
            expect(result).toEqual({ success: false, message: 'Login cancelado pelo usuário.' });
            expect(mockHttpsCallable).not.toHaveBeenCalled(); // Cloud function not called
        });

        // Add other handleGoogleSignInClient error tests...
    });

    // --- handleLogout ---
    describe('handleLogoutClient', () => {
        it('should log out successfully', async () => {
            mockedSignOut.mockResolvedValue(undefined);
            const result = await handleLogoutClient();
            expect(mockedSignOut).toHaveBeenCalledWith(mockAuthInstance);
            expect(result).toEqual({ success: true, message: 'Logout successful.' });
        });

        it('should handle logout errors', async () => {
            mockedSignOut.mockRejectedValue(new Error('Logout failed'));
            const result = await handleLogoutClient();
            expect(mockedSignOut).toHaveBeenCalledWith(mockAuthInstance);
            expect(result).toEqual({ success: false, message: 'Ocorreu um erro inesperado: Logout failed' }); // Mapped generic error
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('[AuthLib:handleLogoutClient] Error during logout:'));
        });
    });

    // --- sendPasswordResetEmailHandler ---
    describe('sendPasswordResetEmailHandler', () => {
         const email = 'reset@example.com';

        it('should send reset email successfully', async () => {
            mockedSendResetEmail.mockResolvedValue(undefined);
            const result = await sendPasswordResetEmailHandler(email);
            expect(mockedSendResetEmail).toHaveBeenCalledWith(mockAuthInstance, email);
            expect(result).toEqual({ success: true, message: 'Se uma conta com este e-mail existir, um link de redefinição de senha foi enviado.' });
        });

        it('should return generic success even if user not found', async () => {
            mockedSendResetEmail.mockRejectedValue({ code: AuthErrorCodes.USER_DELETED });
            const result = await sendPasswordResetEmailHandler('notfound@example.com');
            expect(mockedSendResetEmail).toHaveBeenCalledWith(mockAuthInstance, 'notfound@example.com');
            // Security best practice: don't reveal if email exists
            expect(result).toEqual({ success: true, message: 'Se uma conta com este e-mail existir, um link de redefinição de senha foi enviado.' });
            // Ensure the specific error was logged internally though
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Firebase error sending reset email:'));
        });

         it('should return error if email is invalid', async () => {
            const result = await sendPasswordResetEmailHandler('invalid-email');
            expect(result).toEqual({ success: false, message: "Por favor, insira um endereço de e-mail válido." });
            expect(mockedSendResetEmail).not.toHaveBeenCalled();
         });

        // Add other sendPasswordResetEmailHandler error tests...
    });

    // --- handleChangePassword ---
    describe('handleChangePasswordClient', () => {
        const newPassword = 'NewStrongPassword1!';
        const mockAuthUser = {
            uid: 'test-user-id',
            email: 'test@example.com',
            displayName: 'Test User',
        } as User;

         beforeEach(() => {
            if (mockAuthInstance) {
               (mockAuthInstance as any).currentUser = mockAuthUser; // Set current user
            }
         });
         afterEach(() => {
              if (mockAuthInstance) {
                 (mockAuthInstance as any).currentUser = null; // Clear user after tests
              }
         });

        it('should update password successfully', async () => {
            mockedUpdatePassword.mockResolvedValue(undefined);
            const result = await handleChangePasswordClient(newPassword);
            expect(mockedUpdatePassword).toHaveBeenCalledWith(mockAuthUser, newPassword);
            expect(result).toEqual({ success: true, message: 'Senha atualizada com sucesso.' });
        });

        it('should fail if user is not authenticated', async () => {
             if (mockAuthInstance) { (mockAuthInstance as any).currentUser = null; } // Ensure no user
             const result = await handleChangePasswordClient(newPassword);
             expect(result).toEqual({ success: false, message: 'Usuário não autenticado ou sessão expirada. Faça login novamente.' });
             expect(mockedUpdatePassword).not.toHaveBeenCalled();
         });

         it('should fail if new password is weak', async () => {
             const result = await handleChangePasswordClient('weak');
             expect(result.success).toBe(false);
             expect(result.message).toContain('A senha deve ter no mínimo 8 caracteres.'); // Check Zod message
             expect(mockedUpdatePassword).not.toHaveBeenCalled();
         });

        it('should handle requires-recent-login error', async () => {
            mockedUpdatePassword.mockRejectedValue({ code: AuthErrorCodes.CREDENTIAL_TOO_OLD_LOGIN_AGAIN });
            const result = await handleChangePasswordClient(newPassword);
            expect(mockedUpdatePassword).toHaveBeenCalledWith(mockAuthUser, newPassword);
            expect(result).toEqual({ success: false, message: 'Esta ação é sensível e requer autenticação recente. Faça login novamente.' });
        });

        // Add tests for other password validation rules...
    });

     // --- getUserProfile ---
     describe('getUserProfile', () => {
        const uid = 'profile-test-uid';
        const mockProfileData = { name: 'Profile User', email: 'profile@example.com', currentPlan: 'Premium' };
        const mockDocRef = { id: 'mock-doc-ref-profile', path: `users/${uid}` };

        beforeEach(() => {
            mockedDoc.mockReturnValue(mockDocRef as any);
        });

        it('should return user profile data if document exists', async () => {
            mockedGetDoc.mockResolvedValue({
                exists: () => true,
                data: () => mockProfileData,
            });

            const profile = await getUserProfile(uid);

            expect(mockedDoc).toHaveBeenCalledWith(mockFirestoreInstance, 'users', uid);
            expect(mockedGetDoc).toHaveBeenCalledWith(mockDocRef);
            expect(profile).toEqual(mockProfileData);
        });

        it('should return null if no UID is provided', async () => {
            const profile = await getUserProfile('');
            expect(profile).toBeNull();
            expect(mockedGetDoc).not.toHaveBeenCalled();
        });

        it('should return null if user document does not exist', async () => {
             mockedGetDoc.mockResolvedValue({
                 exists: () => false,
                 data: () => undefined,
             });
             const profile = await getUserProfile(uid);
             expect(profile).toBeNull();
         });

        it('should throw mapped error if Firestore getDoc fails', async () => {
            const firestoreError = new FirestoreError('unavailable', 'Firestore fetch error');
            mockedGetDoc.mockRejectedValue(firestoreError);

            await expect(getUserProfile(uid)).rejects.toThrow(
                "Falha ao operação no banco de dados. Verifique sua conexão ou as permissões do banco." // Check mapped message
            );
            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('[AuthLib:getUserProfile] Error fetching user profile for UID profile-test-uid:'));
        });
    });
});
