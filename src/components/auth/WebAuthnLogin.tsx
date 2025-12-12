import { useState, useEffect } from 'react';
import WebAuthnService from '../../services/webauthn';

interface WebAuthnLoginProps {
    onSuccess?: (result: any) => void;
    onError?: (error: string) => void;
    username?: string | null;
    showUsernameInput?: boolean;
}

const WebAuthnLogin = ({ onSuccess, onError, username = null, showUsernameInput = true }: WebAuthnLoginProps) => {
    const [isSupported, setIsSupported] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [inputUsername, setInputUsername] = useState(username || '');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkSupport();
    }, []);

    const checkSupport = async () => {
        const supported = WebAuthnService.isSupported();
        setIsSupported(supported);
        setLoading(false);
    };

    const handleAuthenticate = async (useUsername: string | null = null) => {
        setIsAuthenticating(true);
        try {
            const result = await WebAuthnService.authenticate(useUsername);
            onSuccess?.(result);
        } catch (error) {
            const errorMessage = WebAuthnService.getErrorMessage(error);
            onError?.(errorMessage);
        } finally {
            setIsAuthenticating(false);
        }
    };

    const handleUsernameLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputUsername.trim()) {
            onError?.('Please enter your username');
            return;
        }
        await handleAuthenticate(inputUsername.trim());
    };

    const handleUsernamelessLogin = async () => {
        await handleAuthenticate(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2">Checking WebAuthn support...</span>
            </div>
        );
    }

    if (!isSupported) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                        <h3 className="text-sm font-medium text-yellow-800">WebAuthn Not Supported</h3>
                        <p className="text-sm text-yellow-700 mt-1">
                            Your browser doesn't support WebAuthn. Please use traditional login or update your browser.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">Secure Authentication</h3>
                <p className="text-sm text-gray-600 mt-1">
                    Use your security key or biometric authentication
                </p>
            </div>

            {/* Username-based login */}
            {showUsernameInput && (
                <form onSubmit={handleUsernameLogin} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                            Username (optional)
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={inputUsername}
                            onChange={(e) => setInputUsername(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter your username"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Enter your username for faster authentication, or leave blank for usernameless login
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={isAuthenticating}
                        className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isAuthenticating ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Authenticating...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                                Authenticate with Username
                            </>
                        )}
                    </button>
                </form>
            )}

            {/* Divider */}
            {showUsernameInput && (
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">or</span>
                    </div>
                </div>
            )}

            {/* Usernameless login */}
            <button
                onClick={handleUsernamelessLogin}
                disabled={isAuthenticating}
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isAuthenticating ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                        Authenticating...
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Quick Authentication
                    </>
                )}
            </button>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex">
                    <svg className="w-4 h-4 text-blue-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="text-xs text-blue-700">
                        <p className="font-medium mb-1">Secure & Fast:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                            <li>Use your fingerprint, face, or security key</li>
                            <li>No passwords needed</li>
                            <li>Works on all your devices</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WebAuthnLogin;