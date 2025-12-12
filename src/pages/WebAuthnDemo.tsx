import { useState, useEffect } from 'react';
import WebAuthnLogin from '../components/auth/WebAuthnLogin';
import WebAuthnSetup from '../components/auth/WebAuthnSetup';

interface User {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    role: string;
}

const WebAuthnDemo = () => {
    const [user, setUser] = useState<User | null>(null);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'
    const [activeTab, setActiveTab] = useState('login');

    useEffect(() => {
        // Check if user is already logged in
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => {
            setMessage('');
            setMessageType('');
        }, 5000);
    };

    const handleLoginSuccess = (result: any) => {
        const { token, user: userData } = result;
        
        // Store authentication data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        setUser(userData);
        showMessage(`Welcome back, ${userData.first_name}! Logged in with WebAuthn.`, 'success');
    };

    const handleLoginError = (error: string) => {
        showMessage(error, 'error');
    };

    const handleSetupSuccess = (msg: string) => {
        showMessage(msg, 'success');
    };

    const handleSetupError = (error: string) => {
        showMessage(error, 'error');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        showMessage('Logged out successfully', 'success');
    };

    const handleTraditionalLogin = () => {
        // Mock traditional login for demo
        const mockUser: User = {
            id: 1,
            first_name: 'Demo',
            last_name: 'User',
            username: 'demouser',
            email: 'demo@example.com',
            role: 'user'
        };
        
        localStorage.setItem('user', JSON.stringify(mockUser));
        setUser(mockUser);
        showMessage('Logged in with traditional method (demo)', 'success');
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">WebAuthn Demo</h1>
                    <p className="text-lg text-gray-600 mt-2">
                        Experience passwordless authentication with WebAuthn
                    </p>
                </div>

                {/* Message Display */}
                {message && (
                    <div className={`mb-6 p-4 rounded-lg ${
                        messageType === 'success' 
                            ? 'bg-green-50 border border-green-200 text-green-800' 
                            : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                        <div className="flex items-center">
                            {messageType === 'success' ? (
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            )}
                            {message}
                        </div>
                    </div>
                )}

                {/* User Status */}
                {user ? (
                    <div className="bg-white shadow rounded-lg p-6 mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Welcome, {user.first_name} {user.last_name}!
                                </h2>
                                <p className="text-gray-600">@{user.username} • {user.email}</p>
                                <p className="text-sm text-gray-500">Role: {user.role}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white shadow rounded-lg p-6 mb-8">
                        <p className="text-gray-600 text-center">Not logged in</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Authentication */}
                    <div className="bg-white shadow rounded-lg p-6">
                        {!user ? (
                            <>
                                <div className="mb-6">
                                    <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                                        <button
                                            onClick={() => setActiveTab('login')}
                                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                                                activeTab === 'login'
                                                    ? 'bg-white text-gray-900 shadow-sm'
                                                    : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            WebAuthn Login
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('traditional')}
                                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                                                activeTab === 'traditional'
                                                    ? 'bg-white text-gray-900 shadow-sm'
                                                    : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            Traditional
                                        </button>
                                    </div>
                                </div>

                                {activeTab === 'login' ? (
                                    <WebAuthnLogin
                                        onSuccess={handleLoginSuccess}
                                        onError={handleLoginError}
                                        showUsernameInput={true}
                                    />
                                ) : (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-medium text-gray-900">Traditional Login</h3>
                                        <p className="text-sm text-gray-600">
                                            For demo purposes, click below to simulate traditional login.
                                        </p>
                                        <button
                                            onClick={handleTraditionalLogin}
                                            className="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                        >
                                            Demo Traditional Login
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Security</h3>
                                <WebAuthnSetup
                                    userId={user.id}
                                    onSuccess={handleSetupSuccess}
                                    onError={handleSetupError}
                                />
                            </div>
                        )}
                    </div>

                    {/* Right Column - Information */}
                    <div className="space-y-6">
                        {/* WebAuthn Benefits */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Why WebAuthn?</h3>
                            <div className="space-y-3">
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="font-medium text-gray-900">Passwordless</p>
                                        <p className="text-sm text-gray-600">No passwords to remember or type</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="font-medium text-gray-900">Phishing Resistant</p>
                                        <p className="text-sm text-gray-600">Cryptographically secure against attacks</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="font-medium text-gray-900">Cross-Platform</p>
                                        <p className="text-sm text-gray-600">Works on all devices and browsers</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="font-medium text-gray-900">Fast & Convenient</p>
                                        <p className="text-sm text-gray-600">One touch or click to authenticate</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Supported Authenticators */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Supported Authenticators</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 border border-gray-200 rounded-lg">
                                    <svg className="w-8 h-8 mx-auto text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-sm font-medium">Touch ID</p>
                                    <p className="text-xs text-gray-500">iOS/macOS</p>
                                </div>
                                <div className="text-center p-3 border border-gray-200 rounded-lg">
                                    <svg className="w-8 h-8 mx-auto text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    <p className="text-sm font-medium">Face ID</p>
                                    <p className="text-xs text-gray-500">iOS/macOS</p>
                                </div>
                                <div className="text-center p-3 border border-gray-200 rounded-lg">
                                    <svg className="w-8 h-8 mx-auto text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm font-medium">Windows Hello</p>
                                    <p className="text-xs text-gray-500">Windows</p>
                                </div>
                                <div className="text-center p-3 border border-gray-200 rounded-lg">
                                    <svg className="w-8 h-8 mx-auto text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                    <p className="text-sm font-medium">Security Keys</p>
                                    <p className="text-xs text-gray-500">YubiKey, etc.</p>
                                </div>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                            <h3 className="text-lg font-medium text-blue-900 mb-3">How to Test</h3>
                            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                                <li>First, log in using traditional method (demo)</li>
                                <li>Click "Add Authenticator" to register WebAuthn</li>
                                <li>Follow your browser's prompts to set up biometrics or security key</li>
                                <li>Log out and try WebAuthn login</li>
                                <li>Experience passwordless authentication!</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WebAuthnDemo;