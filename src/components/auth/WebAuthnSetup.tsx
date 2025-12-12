import { useState, useEffect } from 'react';
import WebAuthnService from '../../services/webauthn';

interface Credential {
    id: string;
    name: string;
    deviceType: string;
    createdAt: string;
    lastUsed?: string;
    transports: string[];
}

interface WebAuthnSetupProps {
    userId: number | string;
    onSuccess?: (message: string) => void;
    onError?: (error: string) => void;
}

const WebAuthnSetup = ({ userId, onSuccess, onError }: WebAuthnSetupProps) => {
    const [isSupported, setIsSupported] = useState(false);
    const [isPlatformAvailable, setIsPlatformAvailable] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [credentials, setCredentials] = useState<Credential[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkSupport();
        if (userId) {
            loadCredentials();
        }
    }, [userId]);

    const checkSupport = async () => {
        const supported = WebAuthnService.isSupported();
        const platformAvailable = await WebAuthnService.isPlatformAuthenticatorAvailable();
        
        setIsSupported(supported);
        setIsPlatformAvailable(platformAvailable);
        setLoading(false);
    };

    const loadCredentials = async () => {
        try {
            const userCredentials = await WebAuthnService.getCredentials(userId);
            setCredentials(userCredentials);
        } catch (error) {
            console.error('Failed to load credentials:', error);
        }
    };

    const handleRegister = async () => {
        if (!userId) {
            onError?.('User ID is required for registration');
            return;
        }

        setIsRegistering(true);
        try {
            await WebAuthnService.register(userId);
            await loadCredentials(); // Refresh the list
            onSuccess?.('WebAuthn authenticator registered successfully!');
        } catch (error) {
            const errorMessage = WebAuthnService.getErrorMessage(error);
            onError?.(errorMessage);
        } finally {
            setIsRegistering(false);
        }
    };

    const handleDeleteCredential = async (credentialId: string) => {
        if (!confirm('Are you sure you want to remove this authenticator?')) {
            return;
        }

        try {
            await WebAuthnService.deleteCredential(userId, credentialId);
            await loadCredentials(); // Refresh the list
            onSuccess?.('Authenticator removed successfully');
        } catch (error) {
            const errorMessage = WebAuthnService.getErrorMessage(error);
            onError?.(errorMessage);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
                            Your browser doesn't support WebAuthn. Please use a modern browser like Chrome, Firefox, Safari, or Edge.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h3 className="text-lg font-medium text-gray-900">Security Keys & Biometrics</h3>
                <p className="text-sm text-gray-600 mt-1">
                    Add security keys or use biometric authentication for passwordless login.
                </p>
            </div>

            {/* Platform Authenticator Info */}
            {isPlatformAvailable && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <h4 className="text-sm font-medium text-green-800">Biometric Authentication Available</h4>
                            <p className="text-sm text-green-700 mt-1">
                                You can use Touch ID, Face ID, or Windows Hello for secure authentication.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Register Buttons */}
            <div className="space-y-3">
                <button
                    onClick={handleRegister}
                    disabled={isRegistering}
                    className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isRegistering ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Setting up biometric login...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Set Up Biometric Login
                        </>
                    )}
                </button>
                
                <p className="text-xs text-gray-500 text-center">
                    Use your fingerprint, face recognition, or device PIN for secure login
                </p>
            </div>

            {/* Existing Credentials */}
            {credentials.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Your Authenticators</h4>
                    <div className="space-y-3">
                        {credentials.map((credential) => (
                            <div key={credential.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        {credential.deviceType === 'singleDevice' ? (
                                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-900">{credential.name}</p>
                                        <div className="text-xs text-gray-500 space-y-1">
                                            <p>Added: {formatDate(credential.createdAt)}</p>
                                            {credential.lastUsed && (
                                                <p>Last used: {formatDate(credential.lastUsed)}</p>
                                            )}
                                            {credential.transports.length > 0 && (
                                                <p>Transports: {credential.transports.join(', ')}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteCredential(credential.id)}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-blue-700">
                        <p className="font-medium mb-1">About WebAuthn Authentication:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Works with security keys (YubiKey, etc.)</li>
                            <li>Supports biometrics (Touch ID, Face ID, Windows Hello)</li>
                            <li>More secure than passwords</li>
                            <li>Works across all your devices</li>
                            <li>No passwords to remember or type</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WebAuthnSetup;