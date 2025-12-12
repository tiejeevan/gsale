import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class WebAuthnService {
    // Check if WebAuthn is supported
    static isSupported() {
        return window.PublicKeyCredential !== undefined;
    }

    // Check if platform authenticator is available (Touch ID, Face ID, Windows Hello)
    static async isPlatformAuthenticatorAvailable() {
        if (!this.isSupported()) return false;
        
        try {
            return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        } catch (error) {
            console.warn('Error checking platform authenticator:', error);
            return false;
        }
    }

    // Register a new WebAuthn credential
    static async register(userId) {
        try {
            // Step 1: Get registration options from server
            const optionsResponse = await fetch(`${API_BASE}/api/webauthn/register/begin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId }),
            });

            if (!optionsResponse.ok) {
                const error = await optionsResponse.json();
                throw new Error(error.error || 'Failed to get registration options');
            }

            const options = await optionsResponse.json();

            // Step 2: Start registration with the browser
            const credential = await startRegistration(options);

            // Step 3: Send credential to server for verification
            const verificationResponse = await fetch(`${API_BASE}/api/webauthn/register/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    credential,
                }),
            });

            if (!verificationResponse.ok) {
                const error = await verificationResponse.json();
                throw new Error(error.error || 'Registration verification failed');
            }

            const result = await verificationResponse.json();
            return result;
        } catch (error) {
            console.error('WebAuthn registration error:', error);
            throw error;
        }
    }

    // Authenticate with WebAuthn
    static async authenticate(username?: string | null) {
        try {
            // Step 1: Get authentication options from server
            const optionsResponse = await fetch(`${API_BASE}/api/webauthn/authenticate/begin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username }),
            });

            if (!optionsResponse.ok) {
                const error = await optionsResponse.json();
                throw new Error(error.error || 'Failed to get authentication options');
            }

            const { challengeId, ...options } = await optionsResponse.json();

            // Step 2: Start authentication with the browser
            const credential = await startAuthentication(options);

            // Step 3: Send credential to server for verification
            const verificationResponse = await fetch(`${API_BASE}/api/webauthn/authenticate/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    challengeId,
                    credential,
                }),
            });

            if (!verificationResponse.ok) {
                const error = await verificationResponse.json();
                throw new Error(error.error || 'Authentication verification failed');
            }

            const result = await verificationResponse.json();
            return result;
        } catch (error) {
            console.error('WebAuthn authentication error:', error);
            throw error;
        }
    }

    // Get user's WebAuthn credentials
    static async getCredentials(userId) {
        try {
            const response = await fetch(`${API_BASE}/api/webauthn/credentials/${userId}`);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to get credentials');
            }

            return await response.json();
        } catch (error) {
            console.error('Get credentials error:', error);
            throw error;
        }
    }

    // Delete a WebAuthn credential
    static async deleteCredential(userId, credentialId) {
        try {
            const response = await fetch(`${API_BASE}/api/webauthn/credentials/${userId}/${credentialId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete credential');
            }

            return await response.json();
        } catch (error) {
            console.error('Delete credential error:', error);
            throw error;
        }
    }

    // Check WebAuthn support on server
    static async checkSupport() {
        try {
            const response = await fetch(`${API_BASE}/api/webauthn/support`);
            return await response.json();
        } catch (error) {
            console.error('Check support error:', error);
            return { supported: false };
        }
    }

    // Get user-friendly error messages
    static getErrorMessage(error) {
        const message = error.message || error.toString();
        
        if (message.includes('NotAllowedError')) {
            return 'Authentication was cancelled or not allowed. Please try again.';
        }
        
        if (message.includes('InvalidStateError')) {
            return 'This authenticator is already registered. Please try a different one.';
        }
        
        if (message.includes('NotSupportedError')) {
            return 'WebAuthn is not supported on this device or browser.';
        }
        
        if (message.includes('SecurityError')) {
            return 'Security error occurred. Please ensure you\'re on a secure connection (HTTPS).';
        }
        
        if (message.includes('AbortError')) {
            return 'Authentication was aborted. Please try again.';
        }
        
        if (message.includes('NetworkError')) {
            return 'Network error occurred. Please check your connection and try again.';
        }
        
        return message;
    }
}

export default WebAuthnService;