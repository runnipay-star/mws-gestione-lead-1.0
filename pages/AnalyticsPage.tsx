
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ApiService } from '../services/apiService';
import type { Client, Lead, AdSpend } from '../types';
import { DollarSign, Trophy, Percent, FilterX, BarChart3, RefreshCw, MinusCircle } from 'lucide-react';

const statusColors: Record<Lead['status'], string> = {
    'Nuovo': 'bg-slate-500 dark:bg-slate-600 text-white',
    'Contattato': 'bg-yellow-400 dark:bg-yellow-500 text-slate-800 dark:text-black',
    'In Lavorazione': 'bg-purple-400 dark:bg-purple-500 text-white',
    'Perso': 'bg-red-500 text-white',
    'Vinto': 'bg-green-500 text-white',
};

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg flex items-center border border-slate-200 dark:border-slate-700">
        <div className="bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 p-3 rounded-full mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
    </div>
);

const AdSpendChart: React.FC<{ data: Record<string, number> }> = ({ data }) => {
    const totalSpend = Object.values(data).reduce((sum, amount) => sum + amount, 0);
    const platforms: {name: 'Meta' | 'Google' | 'TikTok', color: string}[] = [
        { name: 'Meta', color: 'bg-blue-600' },
        { name: 'Google', color: 'bg-red-500' },
        { name: 'TikTok', color: 'bg-slate-900 dark:bg-slate-500' },
    ];

    if (totalSpend === 0) {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 h-full flex flex-col justify-center items-center">
                 <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Distribuzione Spese Pubblicitarie</h3>
                 <p className="text-gray-500 dark:text-gray-400">Nessuna spesa nel periodo selezionato.</p>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Distribuzione Spese Pubblicitarie</h3>
            <div className="space-y-3">
                {platforms.map(platform => {
                    const amount = data[platform.name] || 0;
                    const percentage = totalSpend > 0 ? (amount / totalSpend) * 100 : 0;
                    if (amount === 0 && percentage === 0) return null;
                    
                    return (
                        <div key={platform.name}>
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="font-medium text-slate-700 dark:text-gray-300">{platform.name}</span>
                                <span className="font-semibold text-slate-800 dark:text-white">€ {amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                                <div 
                                    className={`${platform.color} h-4 rounded-full flex items-center justify-center text-white text-xs font-bold transition-all duration-500`} 
                                    style={{ width: `${percentage}%` }}
                                >
                                    {percentage > 15 ? `${percentage.toFixed(1)}%` : ''}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const LeadStatusChart: React.FC<{ data: Record<string, number> }> = ({ data }) => {
     const statusOrder: Lead['status'][] = ['Nuovo', 'Contattato', 'In Lavorazione', 'Vinto', 'Perso'];
     const totalLeads = Object.values(data).reduce((sum, count) => sum + count, 0);

     if (totalLeads === 0) {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 h-full flex flex-col justify-center items-center">
                 <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Riepilogo Stato Lead</h3>
                 <p className="text-gray-500 dark:text-gray-400">Nessun lead nel periodo selezionato.</p>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Riepilogo Stato Lead</h3>
            <div className="space-y-4">
                {statusOrder.map(status => {
                    const count = data[status] || 0;
                    const percentage = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
                     if (count === 0 && percentage === 0) return null;
                     
                    return (
                        <div key={status}>
                             <div className="flex justify-between items-center text-sm mb-1">
                                <span className="font-medium text-slate-700 dark:text-gray-300">{status}</span>
                                <span className="font-semibold text-slate-800 dark:text-white">{count} lead</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-5">
                                <div 
                                    className={`${statusColors[status]} h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500`} 
                                    style={{ width: `${percentage}%` }}
                                >
                                    {percentage > 10 ? `${percentage.toFixed(1)}%` : ''}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};


const AnalyticsPage: React.FC = () => {
    const { user } = useAuth();
    const [allClients, setAllClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Filtri
    const [selectedClientId, setSelectedClientId] = useState<string>('all');
    const [selectedService, setSelectedService] = useState<string>('all');
    const [dateRange, setDateRange] = useState({
        start: '',
        end: new Date().toISOString().split('T')[0] // Oggi
    });
    
    const fetchData = useCallback(async () => {
        if (!isRefreshing) setIsLoading(true);
        if(user?.role === 'admin') {
            const clients = await ApiService.getClients();
            setAllClients(clients);
        } else if (user?.role === 'client') {
            const client = await ApiService.getClientByUserId(user.id);
            if(client) setAllClients([client]);
        }
        if (!isRefreshing) setIsLoading(false);
    }, [user, isRefreshing]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await fetchData();
        setIsRefreshing(false);
    }, [fetchData]);

    const availableServices = useMemo(() => {
        const services = new Set<string>();
        const clientsToScan = selectedClientId === 'all'
            ? allClients
            : allClients.filter(c => c.id === selectedClientId);
            
        clientsToScan.forEach(client => {
            client.leads.forEach(lead => {
                if (lead.service) services.add(lead.service);
            });
             client.adSpends?.forEach(spend => {
                if(spend.service) services.add(spend.service);
            })
        });
        return Array.from(services);
    }, [allClients, selectedClientId]);

    const filteredData = useMemo(() => {
        let leads: Lead[] = [];
        let spends: AdSpend[] = [];

        const clientsToFilter = user?.role === 'admin' && selectedClientId !== 'all'
            ? allClients.filter(c => c.id === selectedClientId)
            : allClients;

        clientsToFilter.forEach(client => {
            leads.push(...client.leads);
            if (client.adSpends) {
                spends.push(...client.adSpends);
            }
        });

        let filteredLeads = leads;
        let filteredSpends = spends;

        // Date range filtering
        const filterStart = dateRange.start ? new Date(dateRange.start) : null;
        if(filterStart) filterStart.setUTCHours(0,0,0,0);
        
        const filterEnd = dateRange.end ? new Date(dateRange.end) : null;
        if(filterEnd) filterEnd.setUTCHours(23,59,59,999);
        
        if (filterStart || filterEnd) {
             filteredLeads = filteredLeads.filter(l => {
                // FIX: Changed createdAt to created_at
                const leadDate = new Date(l.created_at);
                const isAfterStart = filterStart ? leadDate >= filterStart : true;
                const isBeforeEnd = filterEnd ? leadDate <= filterEnd : true;
                return isAfterStart && isBeforeEnd;
             });

            filteredSpends = filteredSpends.filter(s => {
                // FIX: Changed startDate to start_date
                const spendStart = new Date(s.start_date);
                spendStart.setUTCHours(0,0,0,0);
                // FIX: Changed endDate to end_date
                const spendEnd = new Date(s.end_date);
                spendEnd.setUTCHours(23,59,59,999);

                // Overlap condition: (SpendStart <= FilterEnd) and (SpendEnd >= FilterStart)
                const startsBeforeOrOnFilterEnd = filterEnd ? spendStart <= filterEnd : true;
                const endsAfterOrOnFilterStart = filterStart ? spendEnd >= filterStart : true;

                return startsBeforeOrOnFilterEnd && endsAfterOrOnFilterStart;
            });
        }

        if(selectedService !== 'all') {
            filteredLeads = filteredLeads.filter(l => l.service === selectedService);
            filteredSpends = filteredSpends.filter(s => s.service === selectedService);
        }

        return { filteredLeads, filteredSpends };
    }, [allClients, selectedClientId, selectedService, dateRange, user]);
    
    const analyticsData = useMemo(() => {
        const { filteredLeads, filteredSpends } = filteredData;
        const wonLeads = filteredLeads.filter(l => l.status === 'Vinto');
        const totalRevenue = wonLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);
        const totalAdSpend = filteredSpends.reduce((sum, spend) => sum + spend.amount, 0);
        const netRevenue = totalRevenue - totalAdSpend;

        const totalLeadsCount = filteredLeads.length;
        const wonLeadsCount = wonLeads.length;
        const conversionRate = totalLeadsCount > 0 ? (wonLeadsCount / totalLeadsCount) * 100 : 0;
        
        const leadStatusCounts: Record<string, number> = {};
        filteredLeads.forEach(lead => {
            leadStatusCounts[lead.status] = (leadStatusCounts[lead.status] || 0) + 1;
        });

        const adSpendByPlatform: Record<string, number> = { Meta: 0, Google: 0, TikTok: 0 };
        filteredSpends.forEach(spend => {
            adSpendByPlatform[spend.platform] = (adSpendByPlatform[spend.platform] || 0) + spend.amount;
        });

        return {
            totalRevenue,
            totalAdSpend,
            netRevenue,
            wonLeadsCount,
            conversionRate,
            // FIX: Changed createdAt to created_at
            wonLeads: wonLeads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
            leadStatusCounts,
            adSpendByPlatform,
        };
    }, [filteredData]);

    const handleResetFilters = () => {
        setSelectedClientId('all');
        setSelectedService('all');
        setDateRange({ start: '', end: new Date().toISOString().split('T')[0] });
    };

    if (isLoading) {
        return <div className="text-center p-8">Caricamento dati di analisi...</div>;
    }
    
    const selectClasses = "mt-1 block w-full pl-3 pr-10 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-base focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md";
    const inputClasses = "mt-1 block w-full py-2 px-3 text-base bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md";

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <BarChart3 className="w-8 h-8 text-primary-500 dark:text-primary-400" />
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Analisi Dati</h2>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing || isLoading}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-wait transition-colors rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                    title="Aggiorna dati"
                >
                    <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg mb-6 border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    {user?.role === 'admin' && (
                        <div>
                            <label htmlFor="client-filter" className="block text-sm font-medium text-slate-700 dark:text-gray-300">Cliente</label>
                            <select id="client-filter" value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className={selectClasses}>
                                <option value="all">Tutti i Clienti</option>
                                {allClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div className={user?.role !== 'admin' ? 'sm:col-span-2' : ''}>
                         <label htmlFor="service-filter" className="block text-sm font-medium text-slate-700 dark:text-gray-300">Servizio</label>
                         <select id="service-filter" value={selectedService} onChange={e => setSelectedService(e.target.value)} className={selectClasses}>
                                <option value="all">Tutti i Servizi</option>
                                {availableServices.map(s => <option key={s} value={s}>{s}</option>)}
                         </select>
                    </div>
                     <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label htmlFor="start-date" className="block text-sm font-medium text-slate-700 dark:text-gray-300">Dal</label>
                            <input type="date" id="start-date" value={dateRange.start} onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))} className={inputClasses}/>
                        </div>
                         <div>
                            <label htmlFor="end-date" className="block text-sm font-medium text-slate-700 dark:text-gray-300">Al</label>
                            <input type="date" id="end-date" value={dateRange.end} onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))} className={inputClasses}/>
                        </div>
                    </div>
                    <button onClick={handleResetFilters} className="flex items-center justify-center bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white px-4 py-2 rounded-lg shadow-sm hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors h-10">
                        <FilterX className="w-4 h-4 mr-2" />
                        Resetta
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <StatCard title="Fatturato Totale" value={`€ ${analyticsData.totalRevenue.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={<DollarSign />} />
                <StatCard title="Spese Pubblicitarie" value={`€ ${analyticsData.totalAdSpend.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={<MinusCircle />} />
                <StatCard title="Fatturato Netto" value={`€ ${analyticsData.netRevenue.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={<DollarSign color={analyticsData.netRevenue >= 0 ? 'green' : 'red'} />} />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <StatCard title="Lead Vinti" value={analyticsData.wonLeadsCount.toString()} icon={<Trophy />} />
                <StatCard title="Tasso Conversione" value={`${analyticsData.conversionRate.toFixed(1)}%`} icon={<Percent />} />
            </div>
            
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                    <BarChart3 className="w-6 h-6 mr-3 text-primary-500 dark:text-primary-400"/>
                    Visualizzazione Dati
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <AdSpendChart data={analyticsData.adSpendByPlatform} />
                    <LeadStatusChart data={analyticsData.leadStatusCounts} />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 shadow-xl rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                 <h3 className="text-lg font-semibold text-slate-900 dark:text-white p-4 border-b border-slate-200 dark:border-slate-700">Dettaglio Lead Vinti</h3>
                 <div className="overflow-x-auto">
                    <table className="min-w-full hidden md:table">
                        <thead className="bg-slate-50 dark:bg-slate-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Data</th>
                                {user?.role === 'admin' && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cliente</th>}
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nome Lead</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Servizio</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Valore</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                        {analyticsData.wonLeads.map(lead => {
                            const client = allClients.find(c => c.leads.some(l => l.id === lead.id));
                            return (
                                <tr key={lead.id}>
                                    {/* FIX: Changed createdAt to created_at */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(lead.created_at).toLocaleDateString('it-IT')}</td>
                                    {user?.role === 'admin' && <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-gray-300">{client?.name}</td>}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white font-medium">{lead.data.nome || lead.data.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{lead.service || 'N/D'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400 font-bold">{`€ ${(lead.value || 0).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                    {/* Mobile Card View */}
                    <div className="md:hidden p-2 space-y-3">
                        {analyticsData.wonLeads.map(lead => {
                             const client = allClients.find(c => c.leads.some(l => l.id === lead.id));
                             return (
                                <div key={lead.id} className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <div className="flex justify-between items-center">
                                        <div className="font-semibold text-slate-900 dark:text-white">{lead.data.nome || lead.data.name}</div>
                                        <div className="text-sm font-bold text-green-600 dark:text-green-400">{`€ ${(lead.value || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`}</div>
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                                        {user?.role === 'admin' && <span>{client?.name} &middot; </span>}
                                        <span>{lead.service || 'N/D'}</span>
                                    </div>
                                    {/* FIX: Changed createdAt to created_at */}
                                    <div className="text-right text-xs text-slate-400 dark:text-gray-500 mt-2">{new Date(lead.created_at).toLocaleDateString('it-IT')}</div>
                                </div>
                             )
                        })}
                    </div>
                     {analyticsData.wonLeads.length === 0 && (
                        <div className="text-center py-12"><p className="text-gray-500">Nessun lead vinto trovato per i filtri selezionati.</p></div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;