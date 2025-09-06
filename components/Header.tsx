import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LogOut, User as UserIcon, ChevronDown, Settings, FileText, MessageSquare, Sun, Moon } from 'lucide-react';

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    
    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
        setIsMenuOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuRef]);

    const basePath = user?.role === 'admin' ? '/admin' : `/client/${user?.id}`;

    return (
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30">
            <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center">
                    <img src="https://moise-web-srl.com/wp-content/uploads/2025/07/web-app-manifest-512x512-2.png" alt="MWS Gestione Lead Logo" className="h-14 w-14" />
                    <div className="ml-3">
                        <h1 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight">MWS Gestione Lead</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">versione 0.1</p>
                    </div>
                </div>
                
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <UserIcon className="h-5 w-5 text-gray-500 dark:text-gray-400"/>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{user?.username}</span>
                        <ChevronDown className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
                            <div className="py-1">
                                <Link to={`${basePath}/settings`} onClick={() => setIsMenuOpen(false)} className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                                    <Settings size={16} className="mr-3" />
                                    Impostazioni Account
                                </Link>
                                <Link to={`${basePath}/terms`} onClick={() => setIsMenuOpen(false)} className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                                    <FileText size={16} className="mr-3" />
                                    Termini e Condizioni
                                </Link>
                                <Link to={`${basePath}/chat`} onClick={() => setIsMenuOpen(false)} className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                                    <MessageSquare size={16} className="mr-3" />
                                    Chat
                                </Link>
                                <button onClick={toggleTheme} className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                                    {theme === 'dark' ? <Sun size={16} className="mr-3" /> : <Moon size={16} className="mr-3" />}
                                    {theme === 'dark' ? 'Modalità Chiara' : 'Modalità Scura'}
                                </button>
                                <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left flex items-center px-4 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                                >
                                    <LogOut size={16} className="mr-3" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;