import {AlertCircle, Brain, Lock} from 'lucide-react';
import {changePassword} from '../../../api/authApi';
import {useState} from 'react';

interface ChangePasswordProps {
    token: string;
    onPasswordChanged: () => void;
}

export function ChangePassword({token, onPasswordChanged}: ChangePasswordProps) {
    const [newPassword, setNewPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }
        if (newPassword !== confirm) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        setLoading(true);
        try {
            await changePassword(newPassword, token);
            onPasswordChanged();
        } catch {
            setError('Erreur lors du changement de mot de passe');
        } finally {
            setLoading(false);
        }
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

                    <h1 className="text-2xl text-center mb-2 text-gray-900">Changer le mot de passe</h1>
                    <p className="text-sm text-muted-foreground text-center mb-6">
                        Pour votre sécurité, veuillez définir un nouveau mot de passe
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="new-password" className="block text-sm mb-2 text-gray-700">
                                Nouveau mot de passe
                            </label>
                            <div className="relative">
                                <Lock
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"/>
                                <input
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label htmlFor="confirm-password" className="block text-sm mb-2 text-gray-700">
                                Confirmer le mot de passe
                            </label>
                            <div className="relative">
                                <Lock
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"/>
                                <input
                                    id="confirm-password"
                                    type="password"
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
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
                            className="w-full bg-primary text-white py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
                        >
                            {loading ? 'Enregistrement...' : 'Confirmer'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
