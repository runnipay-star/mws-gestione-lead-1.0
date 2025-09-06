

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import ClientForm from '../components/ClientForm';
import { ApiService } from '../services/apiService';
import type { Client, Lead, User, LeadField, AdSpend, AdSpendPlatform, Service } from '../types';
import { Plus, Clipboard, Trash2, Edit, ChevronDown, ChevronUp, Mail, Phone, Upload, RefreshCw, UserCog, Lock, User as UserIcon, Tag, Search, Ban, UserCheck, DollarSign, Settings } from 'lucide-react';
import DateRangeFilter from '../components/DateRangeFilter';
import LeadForm from '../components/LeadForm';
import LeadDetailModal from '../components/LeadDetailModal';
import Pagination from '../components/Pagination';
import FormGenerator from '../components/FormGenerator';

const statusColors: Record<Lead['status'], string> = {
    'Nuovo': 'bg-slate-500 dark:bg-slate-600 text-white',
    'Contattato': 'bg-yellow-400 dark:bg-yellow-500 text-slate-800 dark:text-black',
    'In Lavorazione': 'bg-purple-400 dark:bg-purple-500 text-white',
    'Perso': 'bg-red-500 text-white',
    'Vinto': 'bg-green-500 text-white',
};

const normalizePhoneNumber = (phone: string | undefined): string => {
    if (!phone) return '';
    let normalized = phone.replace(/[\s-()]/g, '');
    if (normalized.startsWith('+39')) {
        normalized = normalized.substring(3);
    } else if (normalized.startsWith('0039')) {
        normalized = normalized.substring(4);
    }
    return normalized;
};


// --- Ad Spend Form ---
interface AdSpendFormProps {
    client: Client;
    editingSpend: AdSpend | null;
    onSuccess: () => void;
}
const AdSpendForm: React.FC<AdSpendFormProps> = ({ client, editingSpend, onSuccess }) => {
    const [service, setService] = useState('');
    const [platform, setPlatform] = useState<AdSpendPlatform>('Meta');
    const [amount, setAmount] = useState<number | ''>('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Date state
    const [periodType, setPeriodType] = useState<'single' | 'range' | 'month'>('single');
    const [singleDate, setSingleDate] = useState(new Date().toISOString().split('T')[0]);
    const [rangeStartDate, setRangeStartDate] = useState('');
    const [rangeEndDate, setRangeEndDate] = useState('');
    const [month, setMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM

    const availableServices = useMemo(() => client.services.map(s => s.name), [client]);

    useEffect(() => {
        if (editingSpend) {
            setService(editingSpend.service);
            setPlatform(editingSpend.platform);
            setAmount(editingSpend.amount);
            
            // Determine period type from existing spend
            if (editingSpend.start_date === editingSpend.end_date) {
                setPeriodType('single');
                setSingleDate(editingSpend.start_date);
            } else {
                const start = new Date(editingSpend.start_date);
                const end = new Date(editingSpend.end_date);
                const isFirstDay = start.getUTCDate() === 1;
                const lastDayOfMonth = new Date(end.getUTCFullYear(), end.getUTCMonth() + 1, 0).getUTCDate();
                const isLastDay = end.getUTCDate() === lastDayOfMonth;

                if (start.getUTCMonth() === end.getUTCMonth() && isFirstDay && isLastDay) {
                    setPeriodType('month');
                    setMonth(editingSpend.start_date.substring(0, 7));
                } else {
                    setPeriodType('range');
                    setRangeStartDate(editingSpend.start_date);
                    setRangeEndDate(editingSpend.end_date);
                }
            }
        } else {
             if (availableServices.length > 0) {
                setService(availableServices[0]);
            }
        }
    }, [editingSpend, availableServices]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!service || amount === '') {
            setError('Servizio e importo sono obbligatori.');
            return;
        }

        let start_date = '';
        let end_date = '';

        switch (periodType) {
            case 'single':
                if (!singleDate) { setError('Selezionare una data.'); return; }
                start_date = end_date = singleDate;
                break;
            case 'range':
                if (!rangeStartDate || !rangeEndDate) { setError('Selezionare un intervallo di date valido.'); return; }
                if (new Date(rangeStartDate) > new Date(rangeEndDate)) { setError('La data di inizio non può essere successiva alla data di fine.'); return; }
                start_date = rangeStartDate;
                end_date = rangeEndDate;
                break;
            case 'month':
                if (!month) { setError('Selezionare un mese.'); return; }
                const [year, m] = month.split('-').map(Number);
                start_date = new Date(Date.UTC(year, m - 1, 1)).toISOString().split('T')[0];
                end_date = new Date(Date.UTC(year, m, 0)).toISOString().split('T')[0];
                break;
        }

        setIsLoading(true);
        try {
            const spendData = { service, platform, amount: Number(amount), start_date, end_date };
            if (editingSpend) {
                await ApiService.updateAdSpend(client.id, editingSpend.id, spendData);
            } else {
                await ApiService.addAdSpend(client.id, spendData);
            }
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Si è verificato un errore.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const inputClasses = "mt-1 block w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-slate-900 dark:text-white";

    const renderDateInputs = () => {
        switch (periodType) {
            case 'single':
                return (
                     <div>
                        <label htmlFor="date" className="block text-sm font-medium text-slate-700 dark:text-gray-300">Data</label>
                        <input type="date" id="date" value={singleDate} onChange={e => setSingleDate(e.target.value)} required className={inputClasses} />
                    </div>
                );
            case 'range':
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="range-start-date" className="block text-sm font-medium text-slate-700 dark:text-gray-300">Dal</label>
                            <input type="date" id="range-start-date" value={rangeStartDate} onChange={e => setRangeStartDate(e.target.value)} required className={inputClasses} />
                        </div>
                        <div>
                             <label htmlFor="range-end-date" className="block text-sm font-medium text-slate-700 dark:text-gray-300">Al</label>
                            <input type="date" id="range-end-date" value={rangeEndDate} onChange={e => setRangeEndDate(e.target.value)} required className={inputClasses} />
                        </div>
                    </div>
                );
            case 'month':
                 return (
                     <div>
                        <label htmlFor="month" className="block text-sm font-medium text-slate-700 dark:text-gray-300">Mese</label>
                        <input type="month" id="month" value={month} onChange={e => setMonth(e.target.value)} required className={inputClasses} />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="service" className="block text-sm font-medium text-slate-700 dark:text-gray-300">Servizio</label>
                    <select id="service" value={service} onChange={e => setService(e.target.value)} required className={inputClasses}>
                         <option value="" disabled>Seleziona un servizio</option>
                         {availableServices.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="platform" className="block text-sm font-medium text-slate-700 dark:text-gray-300">Piattaforma</label>
                    <select id="platform" value={platform} onChange={e => setPlatform(e.target.value as AdSpendPlatform)} required className={inputClasses}>
                        <option value="Meta">Meta</option>
                        <option value="Google">Google</option>
                        <option value="TikTok">TikTok</option>
                    </select>
                </div>
            </div>
             <div>
                <label htmlFor="amount" className="block text-sm font-medium text-slate-700 dark:text-gray-300">Importo (€)</label>
                <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} required className={inputClasses} placeholder="Es. 500" />
            </div>
            
            <fieldset className="border-t border-slate-200 dark:border-slate-700 pt-4">
                 <legend className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">Periodo</legend>
                 <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4">
                    {[
                        ['single', 'Giorno Singolo'], 
                        ['range', 'Intervallo di Date'], 
                        ['month', 'Mese Intero']
                    ].map(([value, label]) => (
                        <label key={value} className="flex items-center text-sm cursor-pointer">
                            <input
                                type="radio"
                                name="periodType"
                                value={value}
                                checked={periodType === value}
                                onChange={() => setPeriodType(value as any)}
                                className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-slate-800 dark:text-gray-300">{label as string}</span>
                        </label>
                    ))}
                 </div>
                 {renderDateInputs()}
            </fieldset>

            {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="submit" disabled={isLoading} className="bg-primary-600 text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoading ? 'Salvataggio...' : (editingSpend ? 'Salva Modifiche' : 'Aggiungi Spesa')}
                </button>
            </div>
        </form>
    );
};

// --- Ad Spend Manager View ---
const AdSpendManager: React.FC<{clients: Client[], onDataUpdate: () => void}> = ({ clients, onDataUpdate }) => {
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [isSpendModalOpen, setIsSpendModalOpen] = useState(false);
    const [editingSpend, setEditingSpend] = useState<AdSpend | null>(null);

    const selectedClient = useMemo(() => clients.find(c => c.id === selectedClientId), [clients, selectedClientId]);

    const totalAdSpend = useMemo(() => {
        return selectedClient?.adSpends?.reduce((sum, spend) => sum + spend.amount, 0) || 0;
    }, [selectedClient?.adSpends]);

    const handleOpenSpendModal = (spend: AdSpend | null = null) => {
        setEditingSpend(spend);
        setIsSpendModalOpen(true);
    };

    const handleDeleteSpend = async (spendId: string) => {
        if (selectedClient && window.confirm("Sei sicuro di voler eliminare questa voce di spesa?")) {
            await ApiService.deleteAdSpend(selectedClient.id, spendId);
            onDataUpdate();
        }
    };
    
    useEffect(() => {
        if(clients.length > 0 && !selectedClientId) {
            setSelectedClientId(clients[0].id);
        }
    }, [clients, selectedClientId]);
    
    return (
        <div>
            {selectedClient && (
                 <Modal 
                    isOpen={isSpendModalOpen} 
                    onClose={() => setIsSpendModalOpen(false)} 
                    title={editingSpend ? 'Modifica Spesa Pubblicitaria' : 'Aggiungi Spesa Pubblicitaria'}>
                     <AdSpendForm client={selectedClient} editingSpend={editingSpend} onSuccess={() => {
                        setIsSpendModalOpen(false);
                        onDataUpdate();
                     }} />
                 </Modal>
            )}
           
            <div className="bg-white dark:bg-slate-800 shadow-xl rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                 <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                     <div className="flex items-center gap-4">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Gestione Spese</h3>
                     </div>
                     <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                        <select
                             id="client-filter-spese"
                             value={selectedClientId}
                             onChange={e => setSelectedClientId(e.target.value)}
                             className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 w-full sm:w-auto"
                        >
                            <option value="" disabled>Seleziona un cliente</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <button onClick={() => handleOpenSpendModal()} disabled={!selectedClient} className="flex items-center justify-center bg-primary-600 text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors disabled:opacity-50">
                            <Plus size={16} className="mr-2"/>
                            Aggiungi Spesa
                        </button>
                    </div>
                 </div>
                 <div className="overflow-x-auto overscroll-x-contain">
                    <table className="min-w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800 hidden md:table-header-group">
                             <tr>
                                {['Periodo', 'Servizio', 'Piattaforma', 'Importo (€)'].map(h => (
                                   <th key={h} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                                ))}
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Azioni</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800 md:divide-y-0">
                            {selectedClient?.adSpends?.map(spend => {
                                const displayDate = spend.start_date === spend.end_date
                                ? new Date(spend.start_date).toLocaleDateString('it-IT', {timeZone: 'UTC'})
                                : `${new Date(spend.start_date).toLocaleDateString('it-IT', {timeZone: 'UTC'})} - ${new Date(spend.end_date).toLocaleDateString('it-IT', {timeZone: 'UTC'})}`;

                                return (
                                <tr key={spend.id} className="block md:table-row mb-4 md:mb-0 border-b md:border-none">
                                    <td data-label="Periodo" className="block md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right md:text-left border-b md:border-b-0 before:content-[attr(data-label)] before:font-bold before:text-slate-600 dark:before:text-slate-300 before:float-left md:before:content-none">{displayDate}</td>
                                    <td data-label="Servizio" className="block md:table-cell px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white font-medium text-right md:text-left border-b md:border-b-0 before:content-[attr(data-label)] before:font-bold before:text-slate-600 dark:before:text-slate-300 before:float-left md:before:content-none">{spend.service}</td>
                                    <td data-label="Piattaforma" className="block md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right md:text-left border-b md:border-b-0 before:content-[attr(data-label)] before:font-bold before:text-slate-600 dark:before:text-slate-300 before:float-left md:before:content-none">{spend.platform}</td>
                                    <td data-label="Importo (€)" className="block md:table-cell px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400 font-bold text-right md:text-left border-b md:border-b-0 before:content-[attr(data-label)] before:font-bold before:text-slate-600 dark:before:text-slate-300 before:float-left md:before:content-none">{spend.amount.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</td>
                                    <td className="block md:table-cell px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => handleOpenSpendModal(spend)} className="text-gray-400 hover:text-primary-500 p-2 rounded-full"><Edit size={16}/></button>
                                        <button onClick={() => handleDeleteSpend(spend.id)} className="text-gray-400 hover:text-red-500 p-2 rounded-full"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                                )}
                            )}
                        </tbody>
                        {selectedClient?.adSpends && selectedClient.adSpends.length > 0 && (
                            <tfoot className="hidden md:table-footer-group">
                                <tr className="bg-slate-100 dark:bg-slate-950 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                                    <td colSpan={3} className="px-6 py-3 text-right text-sm text-slate-800 dark:text-white uppercase">Totale Speso</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">{totalAdSpend.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</td>
                                    <td className="px-6 py-4"></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                 </div>
                  {selectedClient?.adSpends && selectedClient.adSpends.length > 0 && (
                    <div className="md:hidden p-4 bg-slate-100 dark:bg-slate-950 font-bold border-t-2 border-slate-300 dark:border-slate-700 flex justify-between items-center">
                         <span className="text-sm text-slate-800 dark:text-white uppercase">Totale Speso</span>
                         <span className="text-sm text-green-600 dark:text-green-400">{totalAdSpend.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                 )}
                 {(!selectedClient || !selectedClient.adSpends || selectedClient.adSpends.length === 0) && (
                    <div className="text-center py-12"><p className="text-gray-500">Nessuna spesa trovata per questo cliente.</p></div>
                 )}
            </div>
        </div>
    );
}

// --- User Account Form Component ---
interface UserAccountFormProps {
    client: Client;
    onSuccess: () => void;
}
const UserAccountForm: React.FC<UserAccountFormProps> = ({ client, onSuccess }) => {
    const [user, setUser] = useState<Partial<User>>({});
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const userData = await ApiService.getUserById(client.user_id);
            if(userData) {
                setUser(userData);
            }
        };
        fetchUser();
    }, [client]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const updates: Partial<User> = {
            username: user.username,
            email: user.email,
            phone: user.phone,
        };

        if (password) {
            updates.password = password;
        }

        try {
            await ApiService.updateUser(client.user_id, updates);
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Si è verificato un errore.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const inputClasses = "appearance-none relative block w-full px-3 py-3 pl-10 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 placeholder-gray-500 dark:placeholder-gray-400 text-slate-900 dark:text-white rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm";
    const iconClasses = "h-5 w-5 text-gray-400";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <UserIcon className={iconClasses} />
                    </div>
                    <input type="text" name="username" value={user.username || ''} onChange={handleChange} required placeholder="Username" className={inputClasses}/>
                </div>
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <Mail className={iconClasses} />
                    </div>
                    <input type="email" name="email" value={user.email || ''} onChange={handleChange} placeholder="Email" className={inputClasses}/>
                </div>
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <Phone className={iconClasses} />
                    </div>
                    <input type="tel" name="phone" value={user.phone || ''} onChange={handleChange} placeholder="Numero di telefono" className={inputClasses}/>
                </div>
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <Lock className={iconClasses} />
                    </div>
                    <input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Lascia vuoto per non modificare la password" className={inputClasses}/>
                </div>
            </div>

            {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
            
            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="submit" disabled={isLoading} className="bg-primary-600 text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoading ? 'Salvataggio...' : 'Salva Modifiche'}
                </button>
            </div>
        </form>
    );
};


const StatusSelect: React.FC<{ status: Lead['status'], onChange: (newStatus: Lead['status']) => void }> = ({ status, onChange }) => (
    <div className="relative">
        <select
            value={status}
            onChange={(e) => onChange(e.target.value as Lead['status'])}
            onClick={e => e.stopPropagation()}
            className={`appearance-none w-full text-center text-sm font-semibold py-2 px-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400 ${statusColors[status]}`}
        >
            <option value="Nuovo">Nuovo</option>
            <option value="Contattato">Contattato</option>
            <option value="In Lavorazione">In Lavorazione</option>
            <option value="Perso">Perso</option>
            <option value="Vinto">Vinto</option>
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white dark:text-white pointer-events-none" />
    </div>
);

// --- Webhook URL Item Component ---
const WebhookUrlItem: React.FC<{ clientId: string, service: string, fields: LeadField[] }> = ({ clientId, service, fields }) => {
    const [copied, setCopied] = useState(false);

    const webhookUrl = useMemo(() => {
        const baseUrl = window.location.origin + window.location.pathname;
        const queryParams = (fields || []).map(f => `${f.name}=<valore>`).join('&');
        const serviceParam = `service=${encodeURIComponent(service)}`;
        return `${baseUrl}#/api/lead/${clientId}?${queryParams}&${serviceParam}`;
    }, [clientId, service, fields]);

    const copyToClipboard = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative bg-slate-100 dark:bg-slate-900 p-2 rounded-md font-mono text-xs text-slate-600 dark:text-gray-300 break-all border border-slate-200 dark:border-slate-700 flex items-start">
            <Tag size={14} className="mr-2 mt-0.5 text-primary-500 dark:text-primary-400 flex-shrink-0" />
            <div className="flex-grow">
                <span className="font-bold text-slate-800 dark:text-white block mb-1">{service}</span>
                <span>{webhookUrl}</span>
            </div>
            <button onClick={copyToClipboard} className="absolute top-2 right-2 p-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded">
                {copied ? <span className="text-xs text-green-500">Copiato!</span> : <Clipboard size={16} />}
            </button>
        </div>
    );
};


const ClientCard: React.FC<{ 
    client: Client, 
    userStatus?: User['status'],
    onEdit: (client: Client) => void, 
    onDelete: (clientId: string) => void, 
    onEditUser: (client: Client) => void,
    onToggleStatus: () => void,
    isExpanded: boolean,
    onToggleExpand: () => void
}> = ({ client, userStatus, onEdit, onDelete, onEditUser, onToggleStatus, isExpanded, onToggleExpand }) => {
    const isSuspended = userStatus === 'suspended';
    
    return (
        <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-primary-500/10 dark:hover:shadow-primary-500/20 border border-slate-200 dark:border-slate-700 ${isSuspended ? 'opacity-60' : ''}`}>
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center cursor-pointer relative" onClick={onToggleExpand}>
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{client.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{client.leads.length} lead totali</p>
                </div>
                 <div className="flex items-center space-x-1">
                    <button onClick={(e) => {e.stopPropagation(); onToggleStatus()}} className={`p-2 rounded-full ${isSuspended ? 'text-green-500 hover:text-green-400' : 'text-yellow-600 hover:text-yellow-500'}`} title={isSuspended ? 'Riattiva Cliente' : 'Sospendi Cliente'}>
                        {isSuspended ? <UserCheck size={18} /> : <Ban size={18} />}
                    </button>
                    <button onClick={(e) => {e.stopPropagation(); onEditUser(client)}} className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 rounded-full" title="Gestisci Account"><UserCog size={18} /></button>
                    <button onClick={(e) => {e.stopPropagation(); onEdit(client)}} className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 rounded-full" title="Modifica Cliente"><Edit size={18} /></button>
                    <button onClick={(e) => {e.stopPropagation(); onDelete(client.id)}} className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 rounded-full" title="Elimina Cliente"><Trash2 size={18} /></button>
                    <span className="p-2 text-gray-500 dark:text-gray-400">{isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</span>
                </div>
                 {isSuspended && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
                        SOSPESO
                    </div>
                )}
            </div>
            {isExpanded && (
                 <div className="p-4 bg-slate-50 dark:bg-slate-800/50 space-y-4">
                     <div>
                        <h4 className="font-semibold text-slate-700 dark:text-gray-300 mb-2">Webhook URLs per Servizio</h4>
                        {client.services && client.services.length > 0 ? (
                            <div className="space-y-2">
                                {client.services.map(service => (
                                    <WebhookUrlItem key={service.id} clientId={client.id} service={service.name} fields={service.fields || []} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 bg-slate-100 dark:bg-slate-900 p-3 rounded-md border border-slate-200 dark:border-slate-700">Nessun servizio configurato. Modifica il cliente per aggiungerne.</p>
                        )}
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-700 dark:text-gray-300 mb-2">Campi per Servizio</h4>
                        {client.services && client.services.length > 0 ? (
                             client.services.map(service => (
                                <div key={service.id} className="mb-3 last:mb-0">
                                    <h5 className="font-semibold text-slate-600 dark:text-gray-400 text-sm">{service.name}</h5>
                                    {service.fields && service.fields.length > 0 ? (
                                        <ul className="list-disc list-inside text-sm text-gray-500 dark:text-gray-400 pl-2">
                                            {service.fields.map(f => <li key={f.id}>{f.label} <span className="text-gray-400 dark:text-gray-500">({f.name})</span></li>)}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-gray-500 pl-2">Nessun campo per questo servizio.</p>
                                    )}
                                </div>
                            ))
                        ) : (
                             <p className="text-sm text-gray-500">Nessun campo lead configurato.</p>
                        )}
                    </div>
                 </div>
            )}
        </div>
    );
}

const ColumnManager: React.FC<{
    columns: {id: string; label: string}[];
    stickyColumns: Set<string>;
    onToggleSticky: (columnName: string) => void;
    isOpen: boolean;
    onClose: () => void;
}> = ({ columns, stickyColumns, onToggleSticky, isOpen, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef, onClose]);

    if (!isOpen) return null;

    return (
        <div ref={menuRef} className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700 z-50 p-4">
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Blocca Colonne a Sinistra</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
                {columns.map(col => (
                    <label key={col.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={stickyColumns.has(col.id)}
                            onChange={() => onToggleSticky(col.id)}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-gray-300">{col.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};


const AdminDashboard: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingClientForUser, setEditingClientForUser] = useState<Client | null>(null);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const activeView = searchParams.get('view') || 'leads';
    const [filterClientId, setFilterClientId] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<Lead['status'] | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null });
    const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
    const [selectedLead, setSelectedLead] = useState<{lead: Lead, client: Client, historicalLeads: Lead[]} | null>(null);
    const [isLeadDetailModalOpen, setIsLeadDetailModalOpen] = useState(false);
    const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
    const [leadsPerPage, setLeadsPerPage] = useState(25);
    const [currentPage, setCurrentPage] = useState(1);
    const headerCheckboxRef = useRef<HTMLInputElement>(null);
    const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
    const [stickyColumns, setStickyColumns] = useState<Set<string>>(new Set());
    const [isColumnManagerOpen, setIsColumnManagerOpen] = useState(false);

    const fetchData = useCallback(async () => {
        if (!isRefreshing) setIsLoading(true);
        try {
            const clientsData = await ApiService.getClients();
            const usersData = await ApiService.getUsers();
            setClients(clientsData);
            setUsers(usersData);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            if (!isRefreshing) setIsLoading(false);
        }
    }, [isRefreshing]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await fetchData();
        setIsRefreshing(false);
    }, [fetchData]);
    
    const handleToggleExpand = (clientId: string) => {
        setExpandedClientId(currentId => (currentId === clientId ? null : clientId));
    };

    const handleOpenModal = (client: Client | null = null) => {
        setEditingClient(client);
        setIsModalOpen(true);
    };

    const handleOpenUserModal = (client: Client) => {
        setEditingClientForUser(client);
        setIsUserModalOpen(true);
    };
    
    const handleToggleStatus = async (userId: string, currentStatus: User['status']) => {
        const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
        try {
            await ApiService.updateUserStatus(userId, newStatus);
            // Refresh local user data for immediate UI update
            setUsers(prevUsers => 
                prevUsers.map(u => u.id === userId ? { ...u, status: newStatus } : u)
            );
        } catch (error) {
            console.error("Failed to update user status:", error);
        }
    };

    const handleDeleteClient = async (clientId: string) => {
        if(window.confirm("Sei sicuro di voler eliminare questo cliente? L'azione è irreversibile e rimuoverà anche l'account utente associato.")){
            await ApiService.deleteClient(clientId);
            fetchData();
        }
    }

    const handleLeadUpdate = async (clientId: string, leadId: string, updates: Partial<Lead>) => {
        try {
            await ApiService.updateLead(clientId, leadId, updates);
            // Optimistic update for better UX
            setClients(prevClients => 
                prevClients.map(c => 
                    c.id === clientId 
                    ? { ...c, leads: c.leads.map(l => l.id === leadId ? {...l, ...updates} : l) }
                    : c
                )
            );
        } catch (error) {
            console.error("Failed to update lead:", error);
            // Optionally revert or show error
        }
    };
    
    const handleDeleteLead = async (clientId: string, leadId: string) => {
        if (window.confirm("Sei sicuro di voler eliminare questo lead?")) {
            await ApiService.deleteLead(clientId, leadId);
            fetchData();
        }
    };
    
    const handleViewLeadDetails = (lead: Lead, client: Client) => {
        const currentLeadData = lead.data;
        const normalizedPhone = normalizePhoneNumber(currentLeadData.telefono);

        const historicalLeads = client.leads.filter(otherLead => {
            if (otherLead.id === lead.id) return false; // Esclude il lead corrente

            const otherLeadData = otherLead.data;
            const otherNormalizedPhone = normalizePhoneNumber(otherLeadData.telefono);
            
            const nameMatch = (otherLeadData.nome || '').trim().toLowerCase() === (currentLeadData.nome || '').trim().toLowerCase();
            const surnameMatch = (otherLeadData.cognome || '').trim().toLowerCase() === (currentLeadData.cognome || '').trim().toLowerCase();
            const phoneMatch = normalizedPhone && otherNormalizedPhone === normalizedPhone;

            return phoneMatch && nameMatch && surnameMatch;
        });

        setSelectedLead({ lead, client, historicalLeads });
        setIsLeadDetailModalOpen(true);
    };

    const handleAddNote = async (clientId: string, leadId: string, noteContent: string) => {
        try {
            const updatedLead = await ApiService.addNoteToLead(clientId, leadId, noteContent);
            
            setClients(prevClients => 
                prevClients.map(c => 
                    c.id === clientId 
                    ? { ...c, leads: c.leads.map(l => l.id === leadId ? updatedLead : l) }
                    : c
                )
            );
            
            setSelectedLead(prev => prev ? { ...prev, lead: updatedLead } : null);
        } catch (error) {
            console.error("Failed to add note:", error);
        }
    };

    const filteredLeads = useMemo(() => {
        const allLeads = clients.flatMap(client => client.leads.map(lead => ({ lead, client })));
        let filtered = allLeads;

        if (filterClientId !== 'all') {
            filtered = filtered.filter(({ client }) => client.id === filterClientId);
        }

        if (selectedServices.size > 0) {
            filtered = filtered.filter(({ lead }) => lead.service && selectedServices.has(lead.service));
        }
        
        if (statusFilter !== 'all') {
            filtered = filtered.filter(({ lead }) => lead.status === statusFilter);
        }

        if (searchQuery.trim() !== '') {
            const lowercasedQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(({ lead, client }) => 
                Object.values(lead.data).some(val => val.toLowerCase().includes(lowercasedQuery)) ||
                client.name.toLowerCase().includes(lowercasedQuery)
            );
        }

        if (dateRange.start) {
            filtered = filtered.filter(({lead}) => new Date(lead.created_at) >= dateRange.start!);
        }
        if (dateRange.end) {
            filtered = filtered.filter(({lead}) => new Date(lead.created_at) <= dateRange.end!);
        }
        
        return filtered.sort((a, b) => new Date(b.lead.created_at).getTime() - new Date(a.lead.created_at).getTime());
    }, [clients, filterClientId, searchQuery, dateRange, statusFilter, selectedServices]);
    
    const dynamicColumns = useMemo(() => {
        if (filterClientId === 'all' || !filterClientId) return [];
        
        const selectedClient = clients.find(c => c.id === filterClientId);
        if (!selectedClient) return [];

        const servicesToConsider = selectedClient.services.filter(s =>
            selectedServices.size === 0 || selectedServices.has(s.name)
        );

        const allFields = new Map<string, { label: string }>();
        
        // Always include a 'Nome' column, which might not be in every service field list but is on lead.data
        allFields.set('nome', { label: 'Nome' });

        servicesToConsider.forEach(service => {
            (service.fields || []).forEach(field => {
                if (!allFields.has(field.name)) {
                    allFields.set(field.name, { label: field.label });
                }
            });
        });

        return Array.from(allFields, ([name, { label }]) => ({ id: name, label }));
    }, [clients, filterClientId, selectedServices]);

    const leftStickyOffsets = useMemo(() => {
        const offsets: Record<string, number> = {};
        let currentOffset = 96; // Start after checkbox (w-12) and client name (w-32)
        const columnWidth = 180; // Assumed width for sticky columns
        
        dynamicColumns.forEach(col => {
            if (stickyColumns.has(col.id)) {
                offsets[col.id] = currentOffset;
                currentOffset += columnWidth;
            }
        });
        return offsets;
    }, [dynamicColumns, stickyColumns]);


    const paginatedLeads = useMemo(() => {
        const start = (currentPage - 1) * leadsPerPage;
        const end = start + leadsPerPage;
        return filteredLeads.slice(start, end);
    }, [filteredLeads, currentPage, leadsPerPage]);

    const totalPages = Math.ceil(filteredLeads.length / leadsPerPage);

    const handleSelectLead = (leadId: string, isSelected: boolean) => {
        setSelectedLeadIds(prev => {
            const newSet = new Set(prev);
            if (isSelected) {
                newSet.add(leadId);
            } else {
                newSet.delete(leadId);
            }
            return newSet;
        });
    };

    const handleSelectAllOnPage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const allVisibleIds = paginatedLeads.map(({ lead }) => lead.id);
        if (e.target.checked) {
            setSelectedLeadIds(prev => new Set([...prev, ...allVisibleIds]));
        } else {
            setSelectedLeadIds(prev => {
                const newSet = new Set(prev);
                allVisibleIds.forEach(id => newSet.delete(id));
                return newSet;
            });
        }
    };
    
    const handleBulkDelete = async () => {
        if (selectedLeadIds.size === 0) return;
        if (window.confirm(`Sei sicuro di voler eliminare ${selectedLeadIds.size} lead selezionati?`)) {
            const leadsToDelete = Array.from(selectedLeadIds).map(leadId => {
                const leadInfo = filteredLeads.find(({ lead }) => lead.id === leadId);
                return { clientId: leadInfo!.client.id, leadId: leadId };
            }).filter(item => item.clientId);
            
            await ApiService.deleteMultipleLeads(leadsToDelete);
            
            setSelectedLeadIds(new Set());
            if (paginatedLeads.length === selectedLeadIds.size && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
            fetchData();
        }
    };
    
    useEffect(() => {
        const onPageLeadsIds = paginatedLeads.map(item => item.lead.id);
        const selectedOnPageCount = onPageLeadsIds.filter(id => selectedLeadIds.has(id)).length;

        if (headerCheckboxRef.current) {
            if (onPageLeadsIds.length === 0) {
                 headerCheckboxRef.current.checked = false;
                headerCheckboxRef.current.indeterminate = false;
                return;
            }
            if (selectedOnPageCount === 0) {
                headerCheckboxRef.current.checked = false;
                headerCheckboxRef.current.indeterminate = false;
            } else if (selectedOnPageCount === paginatedLeads.length) {
                headerCheckboxRef.current.checked = true;
                headerCheckboxRef.current.indeterminate = false;
            } else {
                headerCheckboxRef.current.checked = false;
                headerCheckboxRef.current.indeterminate = true;
            }
        }
    }, [selectedLeadIds, paginatedLeads]);
    
    useEffect(() => {
        setCurrentPage(1);
        setSelectedLeadIds(new Set());
    }, [filterClientId, searchQuery, dateRange, leadsPerPage, statusFilter, selectedServices]);

    // Reset service and column filters when client changes
    useEffect(() => {
        setSelectedServices(new Set());
        setStickyColumns(new Set());
        setIsColumnManagerOpen(false);
    }, [filterClientId]);

     // Set default sticky column when columns change
    useEffect(() => {
        if (dynamicColumns.length > 0) {
            const defaultStickies = new Set<string>();
            if (dynamicColumns.find(c => c.id === 'nome')) {
                defaultStickies.add('nome');
            }
            setStickyColumns(defaultStickies);
        } else {
            setStickyColumns(new Set());
        }
        setIsColumnManagerOpen(false);
    }, [dynamicColumns]);

    const availableServices = useMemo(() => {
        if (filterClientId === 'all') return [];
        const client = clients.find(c => c.id === filterClientId);
        return client?.services.map(s => s.name) || [];
    }, [clients, filterClientId]);

    const toggleService = (serviceName: string) => {
        setSelectedServices(prev => {
            const newSet = new Set(prev);
            if (newSet.has(serviceName)) newSet.delete(serviceName);
            else newSet.add(serviceName);
            return newSet;
        });
    };

    const handleToggleSticky = (columnName: string) => {
        setStickyColumns(prev => {
            const newSet = new Set(prev);
            if (newSet.has(columnName)) newSet.delete(columnName);
            else newSet.add(columnName);
            return newSet;
        });
    };

    if (isLoading) {
        return <div className="text-center p-8">Caricamento...</div>;
    }
    
    const renderView = () => {
        switch (activeView) {
            case 'clients':
                return (
                    <div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Gestione Clienti</h2>
                            <button onClick={() => handleOpenModal()} className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors w-full sm:w-auto justify-center">
                                <Plus size={18} className="mr-2"/>
                                Aggiungi Cliente
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {clients.map(client => {
                                const user = users.find(u => u.id === client.user_id);
                                return (
                                    <ClientCard 
                                        key={client.id} 
                                        client={client}
                                        userStatus={user?.status}
                                        onEdit={() => handleOpenModal(client)}
                                        onEditUser={() => handleOpenUserModal(client)}
                                        onDelete={() => handleDeleteClient(client.id)}
                                        onToggleStatus={() => user && handleToggleStatus(user.id, user.status)}
                                        isExpanded={expandedClientId === client.id}
                                        onToggleExpand={() => handleToggleExpand(client.id)}
                                    />
                                );
                            })}
                        </div>
                        {clients.length === 0 && (
                            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                <p className="text-gray-500">Nessun cliente trovato.</p>
                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-600">Aggiungi il tuo primo cliente per iniziare.</p>
                            </div>
                        )}
                    </div>
                );
            case 'spese':
                return <AdSpendManager clients={clients} onDataUpdate={fetchData} />;
            case 'forms':
                return <FormGenerator clients={clients} />;
            case 'leads':
            default:
                const getRowBgClass = (isSelected: boolean) => isSelected ? 'bg-primary-50 dark:bg-slate-700' : 'bg-white dark:bg-slate-900';
                
                return (
                     <div className="bg-white dark:bg-slate-800 shadow-xl rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col gap-4">
                            <div className="flex flex-col md:flex-row justify-between md:items-center flex-wrap gap-4">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Tutti i Lead</h3>
                                    <span className="bg-primary-600 text-white text-sm font-semibold px-2.5 py-0.5 rounded-full">
                                        {filteredLeads.length}
                                    </span>
                                    {selectedLeadIds.size > 0 && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500 dark:text-gray-400">{selectedLeadIds.size} selezionati</span>
                                            <button onClick={handleBulkDelete} className="flex items-center bg-red-600 text-white px-3 py-1.5 rounded-lg shadow hover:bg-red-700 transition-colors text-sm">
                                                <Trash2 size={14} className="mr-2"/>
                                                Elimina
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center space-x-2 self-end md:self-center">
                                    <button onClick={() => setIsLeadModalOpen(true)} className="flex items-center bg-primary-600 text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors">
                                        <Plus size={16} className="mr-2"/>
                                        Aggiungi Lead
                                    </button>
                                    <button
                                        onClick={handleRefresh}
                                        disabled={isRefreshing}
                                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-wait transition-colors rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                                        title="Aggiorna"
                                    >
                                        <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row items-center gap-4 flex-wrap">
                                <div className="relative w-full md:w-auto">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                    <input 
                                        type="text"
                                        placeholder="Cerca in tutti i campi..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 w-full sm:w-64"
                                    />
                                </div>
                                <div className="w-full md:w-auto flex-grow md:flex-grow-0 relative">
                                    <div className="flex items-center gap-2">
                                        <select 
                                            id="client-filter"
                                            value={filterClientId}
                                            onChange={e => setFilterClientId(e.target.value)}
                                            className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 w-full"
                                        >
                                            <option value="all">Mostra tutti i clienti</option>
                                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                         {filterClientId !== 'all' && (
                                            <div className="relative">
                                                <button onClick={() => setIsColumnManagerOpen(prev => !prev)} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500">
                                                    <Settings size={16} />
                                                    <span>Colonne</span>
                                                </button>
                                                <ColumnManager
                                                    isOpen={isColumnManagerOpen}
                                                    onClose={() => setIsColumnManagerOpen(false)}
                                                    columns={dynamicColumns}
                                                    stickyColumns={stickyColumns}
                                                    onToggleSticky={handleToggleSticky}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            <DateRangeFilter onDateChange={setDateRange} />
                            </div>

                             {filterClientId !== 'all' && availableServices.length > 0 && (
                                <div className="flex items-center gap-2 flex-wrap border-t border-slate-200 dark:border-slate-700 pt-4">
                                    <span className="text-sm font-medium text-slate-600 dark:text-gray-400">Filtra per servizi:</span>
                                    <button
                                        onClick={() => setSelectedServices(new Set())}
                                        className={`px-3 py-1 text-xs rounded-full transition-colors font-semibold ${selectedServices.size === 0 ? 'bg-primary-600 text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-gray-300'}`}
                                    >
                                        Tutti
                                    </button>
                                    {availableServices.map(service => {
                                        const isSelected = selectedServices.has(service);
                                        return (
                                            <button
                                                key={service}
                                                onClick={() => toggleService(service)}
                                                className={`px-3 py-1 text-xs rounded-full transition-colors font-semibold ${isSelected ? 'bg-primary-600 text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-gray-300'}`}
                                            >
                                                {service}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                        </div>

                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-slate-600 dark:text-gray-400 mr-2">Filtra per stato:</span>
                            <button
                                onClick={() => setStatusFilter('all')}
                                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                                    statusFilter === 'all'
                                    ? 'bg-primary-600 text-white font-semibold'
                                    : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-gray-300'
                                }`}
                            >
                                Tutti
                            </button>
                            {Object.entries(statusColors).map(([status, className]) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status as Lead['status'])}
                                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                                        statusFilter === status
                                        ? `${className} font-semibold ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 ring-current`
                                        : `${className} opacity-70 hover:opacity-100`
                                    }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>

                        <div className="overflow-x-auto overscroll-x-contain">
                           <table className="min-w-full text-sm hidden md:table relative border-separate" style={{borderSpacing: 0}}>
                                <thead className="bg-slate-50 dark:bg-slate-800">
                                    <tr>
                                        <th scope="col" className="sticky left-0 z-20 px-4 py-3 bg-slate-50 dark:bg-slate-800 w-12 border-b border-slate-200 dark:border-slate-700">
                                            <input
                                                type="checkbox"
                                                ref={headerCheckboxRef}
                                                onChange={handleSelectAllOnPage}
                                                className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700 border-slate-400 dark:border-slate-500 text-primary-600 focus:ring-primary-500"
                                            />
                                        </th>

                                        {dynamicColumns.map((col, index) => {
                                            const isSticky = stickyColumns.has(col.id);
                                            let thClasses = "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700";
                                            let styles: React.CSSProperties = { minWidth: col.id === 'nome' ? '200px' : '180px' };
                                            if (isSticky) {
                                                thClasses += ' sticky z-20 bg-slate-50 dark:bg-slate-800';
                                                styles.left = `${index === 0 ? 48 : leftStickyOffsets[col.id] || 0}px`;
                                            }
                                            return <th key={col.id} scope="col" className={thClasses} style={styles}>{col.label}</th>
                                        })}

                                        {filterClientId === 'all' && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 min-w-[150px]">Cliente</th>}
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 min-w-[120px]">Data</th>

                                        <th scope="col" className="sticky z-20 bg-slate-50 dark:bg-slate-800 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700" style={{ right: '224px', width: '160px' }}>Stato</th>
                                        <th scope="col" className="sticky z-20 bg-slate-50 dark:bg-slate-800 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700" style={{ right: '96px', width: '128px' }}>Valore (€)</th>
                                        <th scope="col" className="sticky z-20 bg-slate-50 dark:bg-slate-800 px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700" style={{ right: '0px', width: '96px' }}>Azioni</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-900">
                                    {paginatedLeads.map(({ lead, client }) => {
                                        const isSelected = selectedLeadIds.has(lead.id);
                                        const stickyBg = isSelected ? 'bg-primary-50 dark:bg-slate-700' : 'bg-white dark:bg-slate-900';
                                        
                                        return (
                                            <tr key={lead.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${isSelected ? 'bg-primary-50 dark:bg-slate-700' : ''}`}>
                                                <td className={`sticky left-0 z-10 px-4 py-4 w-12 border-b border-slate-200 dark:border-slate-700 ${stickyBg}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={(e) => handleSelectLead(lead.id, e.target.checked)}
                                                        onClick={e => e.stopPropagation()}
                                                        className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700 border-slate-400 dark:border-slate-500 text-primary-600 focus:ring-primary-500"
                                                    />
                                                </td>

                                                {dynamicColumns.map((col, index) => {
                                                    const isSticky = stickyColumns.has(col.id);
                                                    let tdClasses = `px-6 py-4 whitespace-nowrap text-sm border-b border-slate-200 dark:border-slate-700`;
                                                    let styles: React.CSSProperties = {};
                                                    if(isSticky) {
                                                        tdClasses += ` sticky z-10 ${stickyBg}`;
                                                        styles.left = `${index === 0 ? 48 : leftStickyOffsets[col.id] || 0}px`;
                                                    }
                                                    return (
                                                        <td key={col.id} className={tdClasses} style={styles} onClick={() => handleViewLeadDetails(lead, client)}>
                                                            {col.id === 'nome' ? (
                                                                <div className="cursor-pointer">
                                                                    <div className={`font-semibold text-slate-900 dark:text-white ${lead.status === 'Nuovo' ? 'border-l-4 border-primary-500 pl-2 -ml-2' : ''}`}>{lead.data.nome || 'N/D'}</div>
                                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{lead.service || 'N/D'}</div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-600 dark:text-gray-300 cursor-pointer">{lead.data[col.id] || '-'}</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                
                                                {filterClientId === 'all' && <td className="px-6 py-4 whitespace-nowrap text-sm border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-gray-300 cursor-pointer" onClick={() => handleViewLeadDetails(lead, client)}>{client.name}</td>}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-gray-300 cursor-pointer" onClick={() => handleViewLeadDetails(lead, client)}>
                                                    {new Date(lead.created_at).toLocaleDateString('it-IT')}
                                                </td>
                                                
                                                <td className={`sticky z-10 px-6 py-4 border-b border-slate-200 dark:border-slate-700 ${stickyBg}`} style={{ right: '224px', width: '160px' }}>
                                                    <StatusSelect
                                                        status={lead.status}
                                                        onChange={(newStatus) => handleLeadUpdate(client.id, lead.id, { status: newStatus })}
                                                    />
                                                </td>
                                                <td className={`sticky z-10 px-6 py-4 border-b border-slate-200 dark:border-slate-700 ${stickyBg}`} style={{ right: '96px', width: '128px' }}>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                                                        <input
                                                            type="number"
                                                            defaultValue={lead.value || ''}
                                                            onBlur={(e) => handleLeadUpdate(client.id, lead.id, { value: parseFloat(e.target.value) || 0 })}
                                                            onClick={e => e.stopPropagation()}
                                                            className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md w-full pl-7 pr-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                        />
                                                    </div>
                                                </td>
                                                <td className={`sticky z-10 text-right px-6 py-4 border-b border-slate-200 dark:border-slate-700 ${stickyBg}`} style={{ right: '0px', width: '96px' }}>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteLead(client.id, lead.id); }} className="text-gray-400 hover:text-red-500 p-2 rounded-full"><Trash2 size={16}/></button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                             {/* Mobile Card View */}
                             <div className="divide-y divide-slate-200 dark:divide-slate-800 md:hidden">
                                {paginatedLeads.map(({ lead, client }) => {
                                    const isSelected = selectedLeadIds.has(lead.id);
                                    return (
                                        <div key={lead.id} className={`p-4 ${isSelected ? 'bg-primary-50 dark:bg-slate-700' : 'bg-white dark:bg-slate-900'}`}>
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={(e) => handleSelectLead(lead.id, e.target.checked)}
                                                        onClick={e => e.stopPropagation()}
                                                        className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-700 border-slate-400 dark:border-slate-500 text-primary-600 focus:ring-primary-500"
                                                    />
                                                    <div onClick={() => handleViewLeadDetails(lead, client)}>
                                                        <div className={`font-semibold text-slate-900 dark:text-white ${lead.status === 'Nuovo' ? 'border-l-4 border-primary-500 pl-2 -ml-2' : ''}`}>{lead.data.nome || 'N/D'}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{client.name} &middot; {lead.service || 'N/D'}</div>
                                                    </div>
                                                </div>
                                                 <button onClick={(e) => { e.stopPropagation(); handleDeleteLead(client.id, lead.id); }} className="text-gray-400 hover:text-red-500 p-1 flex-shrink-0"><Trash2 size={16}/></button>
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-4">
                                                 <StatusSelect
                                                    status={lead.status}
                                                    onChange={(newStatus) => handleLeadUpdate(client.id, lead.id, { status: newStatus })}
                                                />
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                                                    <input
                                                        type="number"
                                                        defaultValue={lead.value || ''}
                                                        onBlur={(e) => handleLeadUpdate(client.id, lead.id, { value: parseFloat(e.target.value) || 0 })}
                                                        onClick={e => e.stopPropagation()}
                                                        className="bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md w-full pl-7 pr-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                             </div>
                        </div>
                        {filteredLeads.length === 0 && (
                            <div className="text-center py-12"><p className="text-gray-500">Nessun lead trovato per i filtri selezionati.</p></div>
                        )}

                        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Mostra</span>
                                <select 
                                    value={leadsPerPage} 
                                    onChange={(e) => setLeadsPerPage(Number(e.target.value))}
                                    className="bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md py-1 px-2 text-sm focus:outline-none"
                                >
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                                <span className="text-gray-500 dark:text-gray-400">risultati</span>
                            </div>
                            <Pagination 
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    </div>
            );
        }
    }


    return (
        <div>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingClient ? 'Modifica Dettagli Cliente' : 'Nuovo Cliente'}>
                <ClientForm client={editingClient} onSuccess={() => {
                    setIsModalOpen(false);
                    fetchData();
                }} />
            </Modal>
            
            <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title={`Gestisci Account: ${editingClientForUser?.name || ''}`}>
                {editingClientForUser && (
                    <UserAccountForm 
                        client={editingClientForUser} 
                        onSuccess={() => {
                            setIsUserModalOpen(false);
                        }} 
                    />
                )}
            </Modal>
            
            <Modal isOpen={isLeadModalOpen} onClose={() => setIsLeadModalOpen(false)} title="Aggiungi Nuovo Lead">
                <LeadForm 
                    clients={clients} 
                    onSuccess={() => {
                        setIsLeadModalOpen(false);
                        fetchData();
                    }} 
                />
            </Modal>
            
            <LeadDetailModal 
                isOpen={isLeadDetailModalOpen} 
                onClose={() => setIsLeadDetailModalOpen(false)} 
                lead={selectedLead?.lead || null}
                client={selectedLead?.client || null}
                historicalLeads={selectedLead?.historicalLeads}
                onAddNote={handleAddNote}
            />

            {renderView()}

        </div>
    );
};

export default AdminDashboard;