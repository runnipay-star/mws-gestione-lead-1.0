
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import type { User } from '../types';
import { ApiService } from '../services/apiService';

interface AuthContextType {
    user: User | null;
    login: (username: string, pass: string) => Promise<User | null>;
    logout: () => void;
    isLoading: boolean;
    updateUserContext: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Controlla se c'è un utente salvato nella session storage all'avvio
        const savedUser = sessionStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (username: string, pass: string): Promise<User | null> => {
        const loggedInUser = await ApiService.login(username, pass);
        if (loggedInUser) {
            setUser(loggedInUser);
            sessionStorage.setItem('user', JSON.stringify(loggedInUser));
        }
        return loggedInUser;
    };

    const logout = () => {
        setUser(null);
        sessionStorage.removeItem('user');
    };

    const updateUserContext = (updates: Partial<User>) => {
        if (user) {
            const updatedUser = { ...user, ...updates };
            setUser(updatedUser);
            sessionStorage.setItem('user', JSON.stringify(updatedUser));
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading, updateUserContext }}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};