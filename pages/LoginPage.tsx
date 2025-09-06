import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, User } from 'lucide-react';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const user = await login(username, password);
            if (user) {
                if (user.role === 'admin') {
                    navigate('/admin/dashboard');
                } else {
                    navigate(`/client/${user.id}/dashboard`);
                }
            } else {
                setError('Credenziali non valide. Riprova.');
            }
        } catch (err: any) {
             if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Si è verificato un errore imprevisto. Riprova più tardi.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
            <main className="flex-grow flex items-center justify-center p-4">
                <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-slate-800 shadow-2xl rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="text-center">
                        <img src="https://moise-web-srl.com/wp-content/uploads/2025/07/web-app-manifest-512x512-2.png" alt="MWS Gestione Lead Logo" className="mx-auto h-28 w-28" />
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
                            MWS Gestione Lead
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                            Accedi al tuo account per continuare
                        </p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div className="relative">
                                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    autoComplete="username"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="appearance-none relative block w-full px-3 py-3 pl-10 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 placeholder-gray-500 dark:placeholder-gray-400 text-slate-900 dark:text-white rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                                    placeholder="Username"
                                />
                            </div>
                            <div className="relative">
                                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none relative block w-full px-3 py-3 pl-10 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 placeholder-gray-500 dark:placeholder-gray-400 text-slate-900 dark:text-white rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                                    placeholder="Password"
                                />
                            </div>
                        </div>
                        
                        {error && <p className="text-sm text-red-500 dark:text-red-400 text-center">{error}</p>}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:ring-offset-slate-800 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Accesso in corso...' : 'Accedi'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
            <footer className="w-full text-center p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950">
                <div className="text-sm text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row justify-center items-center gap-x-4 gap-y-1">
                    <a href="https://moise-web-srl.com/" target="_blank" rel="noopener noreferrer" className="hover:text-primary-500 transition-colors">
                        Piattaforma sviluppata da Moise Web Srl
                    </a>
                    <span className="hidden sm:inline">|</span>
                    <span>Sede legale: București (RO)</span>
                    <span className="hidden sm:inline">|</span>
                    <span>P.IVA: RO50469659</span>
                </div>
            </footer>
        </div>
    );
};

export default LoginPage;