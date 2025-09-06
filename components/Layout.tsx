
import React, { ReactNode } from 'react';
import { NavLink, useLocation, useParams } from 'react-router-dom';
import Header from './Header';
import { useAuth } from '../contexts/AuthContext';
import { List, Users, BarChart3, DollarSign, FileCode } from 'lucide-react';

interface LayoutProps {
    children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { user } = useAuth();
    const location = useLocation();
    const params = useParams();

    const isAdmin = user?.role === 'admin';
    const userId = user?.id || params.userId;

    const baseClasses = "flex-shrink-0 flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors text-slate-600 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-slate-700";
    const activeClasses = "font-semibold bg-primary-100 text-primary-700 dark:bg-primary-600 dark:text-white";

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col overflow-x-hidden">
            <Header />
            <div className="flex-grow p-2 sm:p-4 md:p-6 lg:p-8">
                 <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-700 mb-6 pb-2 overflow-x-auto whitespace-nowrap">
                    {isAdmin ? (
                        <>
                            <NavLink 
                                to="/admin/dashboard" 
                                className={({isActive}) => `${baseClasses} ${isActive && (location.search === "" || location.search.includes("view=leads")) ? activeClasses : ''}`}
                            >
                                <List size={16} className="mr-2"/>
                                Gestione Lead
                            </NavLink>
                            <NavLink 
                                to="/admin/dashboard?view=clients" 
                                className={({isActive}) => `${baseClasses} ${isActive && location.search.includes("view=clients") ? activeClasses : ''}`}
                            >
                                <Users size={16} className="mr-2"/>
                                Gestione Clienti
                            </NavLink>
                            <NavLink 
                                to="/admin/dashboard?view=forms" 
                                className={({isActive}) => `${baseClasses} ${isActive && location.search.includes("view=forms") ? activeClasses : ''}`}
                            >
                                <FileCode size={16} className="mr-2"/>
                                Generatore Form
                            </NavLink>
                             <NavLink 
                                to="/admin/dashboard?view=spese" 
                                className={({isActive}) => `${baseClasses} ${isActive && location.search.includes("view=spese") ? activeClasses : ''}`}
                            >
                                <DollarSign size={16} className="mr-2"/>
                                Gestione Spese
                            </NavLink>
                            <NavLink 
                                to="/admin/analytics" 
                                className={({isActive}) => `${baseClasses} ${isActive ? activeClasses : ''}`}
                            >
                                <BarChart3 size={16} className="mr-2"/>
                                Analisi
                            </NavLink>
                        </>
                    ) : (
                        <>
                             <NavLink to={`/client/${userId}/dashboard`} className={({isActive}) => `${baseClasses} ${isActive && !location.search.includes("view=spese") ? activeClasses : ''}`} end>
                                <List size={16} className="mr-2" /> I Miei Lead
                            </NavLink>
                             <NavLink to={`/client/${userId}/dashboard?view=spese`} className={({isActive}) => `${baseClasses} ${isActive && location.search.includes("view=spese") ? activeClasses : ''}`}>
                                <DollarSign size={16} className="mr-2" /> Spese Pubblicitarie
                            </NavLink>
                            <NavLink to={`/client/${userId}/analytics`} end className={({isActive}) => `${baseClasses} ${isActive ? activeClasses : ''}`}>
                                <BarChart3 size={16} className="mr-2" /> Analisi Dati
                            </NavLink>
                        </>
                    )}
                </div>
                <main>
                    {children}
                </main>
            </div>
             <footer className="w-full text-center p-4 mt-auto border-t border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950">
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

export default Layout;