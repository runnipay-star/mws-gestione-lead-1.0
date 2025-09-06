import React, { useState, useEffect, useMemo } from 'react';
import type { Client, Lead, LeadField } from '../types';
import { ApiService } from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

interface LeadFormProps {
    clients: Client[]; // All clients for admin
    client?: Client | null; // Specific client for client view
    onSuccess: () => void;
}

const LeadForm: React.FC<LeadFormProps> = ({ clients, client, onSuccess }) => {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    // Form data state
    const [selectedClientId, setSelectedClientId] = useState<string>(client?.id || (isAdmin && clients.length > 0 ? clients[0].id : ''));
    const [leadData, setLeadData] = useState<Record<string, string>>({});
    const [service, setService] = useState('');
    const [status, setStatus] = useState<Lead['status']>('Nuovo');
    const [value, setValue] = useState<number | ''>('');
    
    // UI/Logic state
    const [currentStep, setCurrentStep] = useState(1);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const selectedClient = useMemo(() => {
        if (!isAdmin) return client || null;
        return clients.find(c => c.id === selectedClientId) || null;
    }, [selectedClientId, clients, isAdmin, client]);

    const currentService = useMemo(() => {
        return selectedClient?.services.find(s => s.name === service) || null;
    }, [selectedClient, service]);

    const stepsConfig = useMemo(() => {
        const fieldChunks: LeadField[][] = [];
        const fields = currentService?.fields || [];
        
        for (let i = 0; i < fields.length; i += 4) {
            fieldChunks.push(fields.slice(i, i + 4));
        }

        const steps = fieldChunks.map((chunk, index) => ({
            step: index + 1,
            title: `Dati Lead (Parte ${index + 1})`,
            fields: chunk
        }));
        
        // Add a final step for metadata if there are fields
        if (fields.length > 0) {
            steps.push({
                step: steps.length + 1,
                title: 'Dettagli Finali',
                fields: [] // Placeholder for status/value
            });
        }
        
        return steps;
    }, [currentService]);

    const totalSteps = stepsConfig.length;

    useEffect(() => {
        // When client changes, reset everything
        if (selectedClient) {
            const firstService = selectedClient.services[0]?.name || '';
            setService(firstService);
            setLeadData({});
            setCurrentStep(1);
            setStatus('Nuovo');
            setValue('');
        }
    }, [selectedClient]);

    const handleDataChange = (fieldName: string, fieldValue: string) => {
        setLeadData(prev => ({ ...prev, [fieldName]: fieldValue }));
    };
    
    const handleNext = () => {
        // Basic validation: check if 'nome' is filled in the first step
        if (currentStep === 1 && !leadData['nome']?.trim()) {
            setError('Il campo Nome è obbligatorio per procedere.');
            return;
        }
        setError('');
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };
    
    const handlePrev = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClientId) {
            setError('Selezionare un cliente.');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            await ApiService.addLead({
                clientId: selectedClientId,
                leadData,
                service,
                status,
                value: value === '' ? undefined : Number(value)
            });
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Si è verificato un errore.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const inputClasses = "block w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-slate-900 dark:text-white";
    const labelClasses = "block text-sm font-medium text-slate-700 dark:text-gray-300";

    const renderStepContent = () => {
        const stepInfo = stepsConfig.find(s => s.step === currentStep);
        if (!stepInfo) return null;

        if (stepInfo.title === 'Dettagli Finali') {
             return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="status-select" className={labelClasses}>Stato</label>
                        <select id="status-select" value={status} onChange={e => setStatus(e.target.value as Lead['status'])} className={`${inputClasses} mt-1`}>
                            <option value="Nuovo">Nuovo</option>
                            <option value="Contattato">Contattato</option>
                            <option value="In Lavorazione">In Lavorazione</option>
                            <option value="Perso">Perso</option>
                            <option value="Vinto">Vinto</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="value-input" className={labelClasses}>Valore (€)</label>
                        <input type="number" id="value-input" value={value} onChange={e => setValue(e.target.value === '' ? '' : parseFloat(e.target.value))} className={`${inputClasses} mt-1`} placeholder="0" min="0"/>
                    </div>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {stepInfo.fields.map(field => (
                    <div key={field.id}>
                        <label htmlFor={`lead-field-${field.name}`} className={labelClasses}>
                            {field.label} {field.name === 'nome' && <span className="text-red-500">*</span>}
                        </label>
                        <input
                            type="text"
                            id={`lead-field-${field.name}`}
                            value={leadData[field.name] || ''}
                            onChange={e => handleDataChange(field.name, e.target.value)}
                            className={`${inputClasses} mt-1`}
                            required={field.name === 'nome'} 
                        />
                    </div>
                ))}
            </div>
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
             {isAdmin && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="client-select" className={labelClasses}>Cliente</label>
                        <select id="client-select" value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} required className={`${inputClasses} mt-1`}>
                            <option value="" disabled>Seleziona un cliente</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    {selectedClient && selectedClient.services.length > 0 && (
                        <div>
                             <label htmlFor="service-select" className={labelClasses}>Servizio</label>
                             <select id="service-select" value={service} onChange={e => setService(e.target.value)} className={`${inputClasses} mt-1`}>
                                {selectedClient.services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                    )}
                </div>
            )}
            
            {selectedClient && totalSteps > 0 && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                    {/* Progress Bar */}
                    <div className="flex items-center justify-center mb-8">
                        {stepsConfig.map(({ step, title }) => (
                             <React.Fragment key={step}>
                                <div className="flex flex-col items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${currentStep >= step ? 'bg-primary-600 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-gray-300'}`}>
                                        {step}
                                    </div>
                                    <p className={`mt-2 text-xs text-center ${currentStep >= step ? 'text-primary-600 dark:text-primary-400 font-semibold' : 'text-slate-500 dark:text-gray-400'}`}>{title}</p>
                                </div>
                                {step < totalSteps && <div className={`flex-1 h-1 mx-2 ${currentStep > step ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-600'}`}></div>}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Step Content */}
                    <div className="min-h-[150px]">
                        {renderStepContent()}
                    </div>
                </div>
            )}
             {selectedClient && totalSteps === 0 && (
                <div className="text-center p-6 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
                    <p className="text-slate-500 dark:text-gray-400">Questo cliente non ha servizi o campi configurati.</p>
                    <p className="text-sm text-slate-400 dark:text-gray-500">Aggiungi un servizio e dei campi nella sezione 'Gestione Clienti' per continuare.</p>
                </div>
             )}

            {error && <p className="text-sm text-red-500 dark:text-red-400 text-center">{error}</p>}
            
            <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
                {totalSteps > 0 && currentStep > 1 ? (
                    <button type="button" onClick={handlePrev} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white px-4 py-2 rounded-lg shadow hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors font-semibold">
                        Indietro
                    </button>
                ) : <span></span>}

                {totalSteps > 0 && currentStep < totalSteps ? (
                     <button type="button" onClick={handleNext} className="bg-primary-600 text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors font-semibold">
                        Avanti
                    </button>
                ) : (
                     <button type="submit" disabled={isLoading || !selectedClient || totalSteps === 0} className="bg-primary-600 text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                        {isLoading ? 'Aggiunta in corso...' : 'Aggiungi Lead'}
                    </button>
                )}
            </div>
        </form>
    );
};

export default LeadForm;
