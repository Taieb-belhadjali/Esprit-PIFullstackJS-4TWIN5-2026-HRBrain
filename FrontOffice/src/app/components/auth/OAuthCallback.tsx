import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type UserRole = 'HR' | 'MANAGER' | 'EMPLOYEE';

interface OAuthCallbackProps {
  onLogin: (result: {
    token: string;
    mustChangePassword: boolean;
    user: { id: string; name: string; email: string; role: UserRole };
  }) => void;
}

export function OAuthCallback({ onLogin }: OAuthCallbackProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const name = params.get('name');
    const email = params.get('email');
    const role = params.get('role') as UserRole;
    const id = params.get('id');

    if (token && name && email && role && id) {
      onLogin({ token, mustChangePassword: false, user: { id, name, email, role } });
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center">
      <p className="text-muted-foreground">Connexion en cours...</p>
    </div>
  );
}
