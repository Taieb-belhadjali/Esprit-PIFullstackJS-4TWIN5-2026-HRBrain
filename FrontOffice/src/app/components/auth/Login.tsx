import {useState} from 'react';
import {AlertCircle, Brain, Lock, Mail} from 'lucide-react';
import {login} from '../../../api/authApi';

type UserRole = 'HR' | 'Manager' | 'Employee';


interface LoginResult {
    token: string;
    mustChangePassword: boolean;
    user: { id: string; name: string; email: string; role: UserRole };
}


interface LoginProps {
    onLogin: (result: LoginResult) => void;
}

export function Login({onLogin}: LoginProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Email et mot de passe requis');
            return;
        }

        setLoading(true);
        try {
            const res = await login(email, password);
            onLogin(res.data);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Email ou mot de passe incorrect');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:3000/auth/google';
    };

    return (
        <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="flex items-center justify-center mb-6">
                        <div className="bg-primary rounded-lg p-3">
                            <Brain className="w-8 h-8 text-white"/>
                        </div>
                    </div>

                    <h1 className="text-2xl text-center mb-2 text-gray-900">Welcome to HRBrain</h1>
                    <p className="text-sm text-muted-foreground text-center mb-6">
                        AI-Powered Employee Recommendation System
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-sm mb-2 text-gray-700">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"/>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="your.email@company.com"
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label htmlFor="password" className="block text-sm mb-2 text-gray-700">
                                Password
                            </label>
                            <div className="relative">
                                <Lock
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"/>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-1 mb-4 text-destructive text-sm">
                                <AlertCircle className="w-4 h-4"/>
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 mb-4"
                        >
                            {loading ? 'Connexion...' : 'Sign In'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 h-px bg-input"/>
                        <span className="text-xs text-muted-foreground">ou</span>
                        <div className="flex-1 h-px bg-input"/>
                    </div>

                    {/* Google OAuth button — visible only after first password change */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 border border-input py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4"
                                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853"
                                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05"
                                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                            <path fill="#EA4335"
                                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continuer avec Google
                    </button>
                </div>

                <p className="text-xs text-center mt-6 text-muted-foreground">
                    By signing in, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
}