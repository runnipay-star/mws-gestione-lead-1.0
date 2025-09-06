import React, { useState, useMemo, useEffect } from 'react';
import type { Client, LeadField } from '../types';
import { FileCode, Clipboard, Link, Check, Eye, ShieldCheck, FileText, Palette, Database, Webhook } from 'lucide-react';

const selectClasses = "w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-slate-900 dark:text-white";
const inputClasses = "block w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-slate-900 dark:text-white";

interface FormGeneratorProps {
    clients: Client[];
}

const FormGenerator: React.FC<FormGeneratorProps> = ({ clients }) => {
    // Form configuration state
    const [selectedClientId, setSelectedClientId] = useState('');
    const [selectedServiceName, setSelectedServiceName] = useState('');
    
    // Supabase & Post-Submit Config
    const [supabaseUrl, setSupabaseUrl] = useState('https://lmuunqingyolxjuktred.supabase.co');
    const [supabaseAnonKey, setSupabaseAnonKey] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtdXVucWluZ3lvbHhqdWt0cmVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTAzNjYsImV4cCI6MjA3MjU4NjM2Nn0.DZ8CVuTNTehfMitQpPFJoJumUsngTbhUbcSgK6FGHQE');
    const [thankYouUrl, setThankYouUrl] = useState('');
    const [webhookUrl, setWebhookUrl] = useState('');

    const [isMultiStep, setIsMultiStep] = useState(false);
    const [fieldSteps, setFieldSteps] = useState<Record<string, number>>({});
    const [showFormTitle, setShowFormTitle] = useState(true);
    const [formTitle, setFormTitle] = useState('Lascia i tuoi dati');
    
    // Consent state
    const [enablePrivacyPolicy, setEnablePrivacyPolicy] = useState(false);
    const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState('');
    const [privacyPolicyCheckedByDefault, setPrivacyPolicyCheckedByDefault] = useState(false);
    const [enableTerms, setEnableTerms] = useState(false);
    const [termsUrl, setTermsUrl] = useState('');
    const [termsCheckedByDefault, setTermsCheckedByDefault] = useState(false);
    
    // Style state
    const [primaryColor, setPrimaryColor] = useState('#3b82f6');
    const [buttonTextColor, setButtonTextColor] = useState('#ffffff');
    const [formBackgroundColor, setFormBackgroundColor] = useState('#ffffff');
    const [textColor, setTextColor] = useState('#1e293b');
    const [labelColor, setLabelColor] = useState('#475569');
    const [submitButtonText, setSubmitButtonText] = useState('Invia Richiesta');

    const [generatedCode, setGeneratedCode] = useState('');
    const [codeCopied, setCodeCopied] = useState(false);

    const selectedClient = useMemo(() => clients.find(c => c.id === selectedClientId), [clients, selectedClientId]);
    
    const serviceFields = useMemo(() => {
        if (!selectedClient || !selectedServiceName) return [];
        const service = selectedClient.services.find(s => s.name === selectedServiceName);
        return service ? service.fields : [];
    }, [selectedClient, selectedServiceName]);


    useEffect(() => {
        if (selectedClient && selectedClient.services.length > 0) {
            if (!selectedClient.services.some(s => s.name === selectedServiceName)) {
                 setSelectedServiceName(selectedClient.services[0].name);
            }
        } else {
            setSelectedServiceName('');
        }
    }, [selectedClient, selectedServiceName]);
    
    useEffect(() => {
        // FIX: Key field steps by field.name for uniqueness, solving the shared step number bug.
        const initialSteps = serviceFields.reduce((acc, field) => {
            acc[field.name] = 1; // All fields start at step 1
            return acc;
        }, {} as Record<string, number>);
        setFieldSteps(initialSteps);
        setIsMultiStep(false); // Reset multi-step toggle
    }, [serviceFields]);


    // Update generated code for preview whenever config changes
    useEffect(() => {
        if(selectedClient){
            const code = generateFormCode({
                client: selectedClient,
                serviceName: selectedServiceName,
                fields: serviceFields,
                supabaseUrl,
                supabaseAnonKey,
                thankYouUrl,
                webhookUrl,
                isMultiStep,
                fieldSteps,
                showFormTitle,
                formTitle,
                enablePrivacyPolicy,
                privacyPolicyUrl,
                privacyPolicyCheckedByDefault,
                enableTerms,
                termsUrl,
                termsCheckedByDefault,
                primaryColor,
                buttonTextColor,
                formBackgroundColor,
                textColor,
                labelColor,
                submitButtonText
            });
            setGeneratedCode(code);
        } else {
            setGeneratedCode('');
        }
    }, [selectedClient, selectedServiceName, serviceFields, supabaseUrl, supabaseAnonKey, thankYouUrl, webhookUrl, isMultiStep, fieldSteps, showFormTitle, formTitle, enablePrivacyPolicy, privacyPolicyUrl, privacyPolicyCheckedByDefault, enableTerms, termsUrl, termsCheckedByDefault, primaryColor, buttonTextColor, formBackgroundColor, textColor, labelColor, submitButtonText]);
    
    const handleMultiStepToggle = (checked: boolean) => {
        setIsMultiStep(checked);
    
        if (checked) {
            const totalCurrentSteps = new Set(Object.values(fieldSteps)).size;
            
            if (totalCurrentSteps === 1 && serviceFields.length > 2) {
                const newFieldSteps = { ...fieldSteps };
                serviceFields.forEach((field, index) => {
                    // FIX: Key by field.name
                    newFieldSteps[field.name] = Math.floor(index / 2) + 1;
                });
                setFieldSteps(newFieldSteps);
            }
        }
    };


    const handleStepChange = (fieldName: string, step: number) => {
        setFieldSteps(prev => ({ ...prev, [fieldName]: Math.max(1, step) }));
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(generatedCode);
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
    };
    
    return (
        <div>
             <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center mb-6"><FileCode size={28} className="mr-3 text-primary-500"/>Generatore Form</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Configuration Panel */}
                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 space-y-6 self-start">
                    <h3 className="text-xl font-semibold border-b border-slate-200 dark:border-slate-700 pb-3">Configura Modulo</h3>
                     <div>
                        <h4 className="text-md font-semibold mb-2">1. Seleziona Cliente e Servizio</h4>
                        <div className="space-y-4">
                            <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className={selectClasses}>
                                <option value="" disabled>Seleziona un cliente...</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            {selectedClient && (
                                <select value={selectedServiceName} onChange={e => setSelectedServiceName(e.target.value)} className={selectClasses} disabled={!selectedClient}>
                                    <option value="" disabled>Seleziona un servizio...</option>
                                    {selectedClient.services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                </select>
                            )}
                        </div>
                    </div>
                    
                    {selectedClient && (
                        <>
                            <div>
                                <h4 className="text-md font-semibold mb-2 flex items-center"><Database size={16} className="mr-2"/>2. Connessione Diretta a Supabase</h4>
                                <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">URL Supabase</label>
                                        <input type="url" placeholder="https://..." value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} className={inputClasses} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Chiave Anon Supabase</label>
                                        <textarea placeholder="eyJ..." value={supabaseAnonKey} onChange={e => setSupabaseAnonKey(e.target.value)} className={`${inputClasses} h-24 resize-y font-mono text-xs`} />
                                    </div>
                                     <div>
                                        <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">Client ID (generato)</label>
                                        <input type="text" value={selectedClient?.id || ''} readOnly className={`${inputClasses} bg-slate-200 dark:bg-slate-900 cursor-not-allowed font-mono text-xs`} />
                                    </div>
                                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <label className="flex items-center text-sm font-medium text-slate-700 dark:text-gray-300 mb-1"><Link size={14} className="mr-2"/>Pagina di Ringraziamento (Opzionale)</label>
                                        <input type="url" placeholder="https://tuosito.com/grazie" value={thankYouUrl} onChange={e => setThankYouUrl(e.target.value)} className={inputClasses}/>
                                    </div>
                                </div>
                            </div>
                            
                             <div>
                                <h4 className="text-md font-semibold mb-2 flex items-center"><Webhook size={16} className="mr-2"/>3. Webhook Esterno (Opzionale)</h4>
                                <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">URL Webhook</label>
                                        <input type="url" placeholder="https://your-webhook-url.com/hook" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} className={inputClasses} />
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-gray-400">
                                        Se inserito, una copia dei dati del lead verrà inviata anche a questo indirizzo dopo essere stata salvata su Supabase.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-md font-semibold mb-2">4. Struttura del Form</h4>
                                <div className="space-y-2">
                                    <label className="flex items-center cursor-pointer p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50">
                                        <input type="checkbox" checked={isMultiStep} onChange={e => handleMultiStepToggle(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                        <span className="ml-2 text-sm font-medium text-slate-700 dark:text-gray-300">Dividi in più step</span>
                                    </label>
                                    
                                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                        <label className="flex items-center cursor-pointer p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50">
                                            <input type="checkbox" checked={showFormTitle} onChange={e => setShowFormTitle(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                            <span className="ml-2 text-sm font-medium text-slate-700 dark:text-gray-300">Mostra titolo del modulo</span>
                                        </label>
                                        {showFormTitle && (
                                            <div className="mt-2 pl-6">
                                                <label className="text-sm font-medium text-slate-700 dark:text-gray-300">Testo del Titolo</label>
                                                <input 
                                                    type="text" 
                                                    value={formTitle} 
                                                    onChange={e => setFormTitle(e.target.value)}
                                                    className={`${inputClasses} mt-1`}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {isMultiStep && (
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3 max-h-60 overflow-y-auto">
                                            {serviceFields.map(field => (
                                                <div key={field.id || field.name} className="flex items-center justify-between gap-4">
                                                    <label className="text-sm">{field.label}</label>
                                                    <input 
                                                        type="number" 
                                                        min="1" 
                                                        value={fieldSteps[field.name] || 1} 
                                                        onChange={e => handleStepChange(field.name, parseInt(e.target.value, 10))}
                                                        className="w-20 text-center bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-1"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-md font-semibold mb-2">5. Consensi</h4>
                                <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                    {/* Privacy Policy */}
                                    <div className="space-y-2">
                                        <label className="flex items-center cursor-pointer">
                                            <input type="checkbox" checked={enablePrivacyPolicy} onChange={e => setEnablePrivacyPolicy(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                            <span className="ml-2 text-sm font-medium text-slate-700 dark:text-gray-300 flex items-center"><ShieldCheck size={14} className="mr-1.5"/>Aggiungi consenso Privacy Policy</span>
                                        </label>
                                        {enablePrivacyPolicy && (
                                            <div className="pl-6 space-y-2">
                                                <input type="url" placeholder="URL Privacy Policy" value={privacyPolicyUrl} onChange={e => setPrivacyPolicyUrl(e.target.value)} className={inputClasses} />
                                                 <label className="flex items-center cursor-pointer text-xs">
                                                    <input type="checkbox" checked={privacyPolicyCheckedByDefault} onChange={e => setPrivacyPolicyCheckedByDefault(e.target.checked)} className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                                    <span className="ml-2 text-slate-600 dark:text-gray-400">Selezionato di default</span>
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                    {/* Terms and Conditions */}
                                    <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                        <label className="flex items-center cursor-pointer">
                                            <input type="checkbox" checked={enableTerms} onChange={e => setEnableTerms(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                            <span className="ml-2 text-sm font-medium text-slate-700 dark:text-gray-300 flex items-center"><FileText size={14} className="mr-1.5"/>Aggiungi Termini e Condizioni</span>
                                        </label>
                                        {enableTerms && (
                                            <div className="pl-6 space-y-2">
                                                <input type="url" placeholder="URL Termini e Condizioni" value={termsUrl} onChange={e => setTermsUrl(e.target.value)} className={inputClasses} />
                                                 <label className="flex items-center cursor-pointer text-xs">
                                                    <input type="checkbox" checked={termsCheckedByDefault} onChange={e => setTermsCheckedByDefault(e.target.checked)} className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                                    <span className="ml-2 text-slate-600 dark:text-gray-400">Selezionato di default</span>
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                             <div>
                                <h4 className="text-md font-semibold mb-2">6. Stile e Colori</h4>
                                <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                        <div className="flex flex-col items-center">
                                            <label className="text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">Primario</label>
                                            <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-12 h-12 rounded-full border-2 border-white dark:border-slate-600 shadow-sm cursor-pointer"/>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <label className="text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">Testo Pulsante</label>
                                            <input type="color" value={buttonTextColor} onChange={e => setButtonTextColor(e.target.value)} className="w-12 h-12 rounded-full border-2 border-white dark:border-slate-600 shadow-sm cursor-pointer"/>
                                        </div>
                                         <div className="flex flex-col items-center">
                                            <label className="text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">Sfondo Form</label>
                                            <input type="color" value={formBackgroundColor} onChange={e => setFormBackgroundColor(e.target.value)} className="w-12 h-12 rounded-full border-2 border-white dark:border-slate-600 shadow-sm cursor-pointer"/>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <label className="text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">Testo Campi</label>
                                            <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-12 h-12 rounded-full border-2 border-white dark:border-slate-600 shadow-sm cursor-pointer"/>
                                        </div>
                                         <div className="flex flex-col items-center">
                                            <label className="text-xs font-medium text-slate-600 dark:text-gray-400 mb-1">Etichette</label>
                                            <input type="color" value={labelColor} onChange={e => setLabelColor(e.target.value)} className="w-12 h-12 rounded-full border-2 border-white dark:border-slate-600 shadow-sm cursor-pointer"/>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <label className="text-sm font-medium text-slate-700 dark:text-gray-300">Testo Pulsante di Invio</label>
                                        <input type="text" value={submitButtonText} onChange={e => setSubmitButtonText(e.target.value)} className={`${inputClasses} mt-1`} />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                
                {/* Live Preview and Code */}
                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700">
                     <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                        <h3 className="text-lg font-semibold flex items-center"><Eye size={18} className="mr-2"/>Anteprima e Codice</h3>
                        <button onClick={handleCopyCode} disabled={!generatedCode} className="flex items-center justify-center bg-slate-200 dark:bg-slate-600 px-3 py-1.5 rounded-md text-sm hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors disabled:opacity-50">
                            {codeCopied ? <Check size={16} className="mr-2 text-green-500"/> : <Clipboard size={16} className="mr-2"/>}
                            {codeCopied ? 'Copiato!' : 'Copia Codice'}
                        </button>
                    </div>
                     {generatedCode ? (
                        <div className="h-[600px] border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden shadow-inner">
                             <iframe 
                                title="Form Preview"
                                srcDoc={generatedCode}
                                className="w-full h-full border-0"
                             />
                        </div>
                    ) : (
                        <div className="text-center h-[600px] flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-gray-400 p-4">
                            <p className="font-semibold">L'anteprima del modulo apparirà qui.</p>
                            <p className="text-sm mt-2">Seleziona un cliente per iniziare.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FormGenerator;

// --- Helper function to generate the form code ---

interface GenerateFormCodeOptions {
    client: Client;
    serviceName: string;
    fields: LeadField[];
    supabaseUrl: string;
    supabaseAnonKey: string;
    thankYouUrl: string;
    webhookUrl: string;
    isMultiStep: boolean;
    fieldSteps: Record<string, number>;
    showFormTitle: boolean;
    formTitle: string;
    enablePrivacyPolicy: boolean;
    privacyPolicyUrl: string;
    privacyPolicyCheckedByDefault: boolean;
    enableTerms: boolean;
    termsUrl: string;
    termsCheckedByDefault: boolean;
    primaryColor: string;
    buttonTextColor: string;
    formBackgroundColor: string;
    textColor: string;
    labelColor: string;
    submitButtonText: string;
}

function generateFieldHtml(field: LeadField) {
    const isRequired = !!field.required;
    const requiredAttr = isRequired ? 'required' : '';
    const placeholder = `placeholder="Inserisci ${field.label.toLowerCase()}"`;
    const fieldId = `field-${field.name}`;

    const labelHtml = `<label for="${fieldId}">${field.label}${isRequired ? ' <span class="required-asterisk">*</span>' : ''}</label>`;

    let fieldHtml = '';

    switch (field.type) {
        case 'textarea':
            fieldHtml = `<textarea id="${fieldId}" name="${field.name}" ${placeholder} ${requiredAttr}></textarea>`;
            break;
        
        case 'select':
            const selectOptions = field.options?.map(opt => `<option value="${opt.trim()}">${opt.trim()}</option>`).join('') || '';
            fieldHtml = `<select id="${fieldId}" name="${field.name}" ${requiredAttr}>
                <option value="" disabled selected>Seleziona un'opzione</option>
                ${selectOptions}
            </select>`;
            break;

        case 'radio':
            const radioOptions = field.options?.map((opt, index) => `
                <div class="radio-option">
                    <input type="radio" id="${fieldId}-${index}" name="${field.name}" value="${opt.trim()}" ${index === 0 && isRequired ? requiredAttr : ''}>
                    <label for="${fieldId}-${index}">${opt.trim()}</label>
                </div>
            `).join('') || '';
            return `<div class="form-group radio-group">
                <label>${field.label}${isRequired ? ' <span class="required-asterisk">*</span>' : ''}</label>
                <div class="radio-options-wrapper">${radioOptions}</div>
            </div>`;

        case 'checkbox':
            return `<div class="form-group checkbox-group">
                <div class="checkbox-wrapper">
                    <input type="checkbox" id="${fieldId}" name="${field.name}" value="true" ${requiredAttr}>
                    <label for="${fieldId}">${field.label}${isRequired ? ' <span class="required-asterisk">*</span>' : ''}</label>
                </div>
            </div>`;
        
        case 'file':
             fieldHtml = `<input type="file" id="${fieldId}" name="${field.name}" ${requiredAttr}>`;
             break;

        default: // text, email, tel, date, number, password, url
            fieldHtml = `<input type="${field.type || 'text'}" id="${fieldId}" name="${field.name}" ${placeholder} ${requiredAttr}>`;
            break;
    }
    
    return `<div class="form-group">${labelHtml}${fieldHtml}</div>`;
}

function generateFormCode({ 
    client, serviceName, fields, supabaseUrl, supabaseAnonKey, thankYouUrl, webhookUrl, isMultiStep, fieldSteps,
    showFormTitle, formTitle,
    enablePrivacyPolicy, privacyPolicyUrl, privacyPolicyCheckedByDefault,
    enableTerms, termsUrl, termsCheckedByDefault,
    primaryColor, buttonTextColor, formBackgroundColor, textColor, labelColor, submitButtonText
}: GenerateFormCodeOptions): string {
    const uniqueFormId = `lf-wrapper-${Date.now()}`;
    
    const fieldsByStep = fields.reduce((acc, field) => {
        // FIX: Key steps by field.name for consistency and correctness
        const step = isMultiStep ? (fieldSteps[field.name] || 1) : 1;
        if (!acc[step]) acc[step] = [];
        acc[step].push(field);
        return acc;
    }, {} as Record<number, LeadField[]>);

    const sortedSteps = Object.keys(fieldsByStep).map(Number).sort((a, b) => a - b);
    const totalSteps = sortedSteps.length;

    const generateConsentsHtml = () => {
        let html = '';
        if (enablePrivacyPolicy) {
            const link = privacyPolicyUrl ? `<a href="${privacyPolicyUrl}" target="_blank" rel="noopener noreferrer">Privacy Policy</a>` : 'Privacy Policy';
            html += `
            <div class="form-group checkbox-group consent-group">
                <div class="checkbox-wrapper">
                    <input type="checkbox" id="privacy_policy_consent" name="privacy_policy_consent" value="true" required ${privacyPolicyCheckedByDefault ? 'checked' : ''}>
                    <label for="privacy_policy_consent">Ho letto e accetto la ${link}.<span class="required-asterisk">*</span></label>
                </div>
            </div>`;
        }
        if (enableTerms) {
            const link = termsUrl ? `<a href="${termsUrl}" target="_blank" rel="noopener noreferrer">Termini e Condizioni</a>` : 'Termini e Condizioni';
            html += `
            <div class="form-group checkbox-group consent-group">
                <div class="checkbox-wrapper">
                    <input type="checkbox" id="terms_consent" name="terms_consent" value="true" required ${termsCheckedByDefault ? 'checked' : ''}>
                    <label for="terms_consent">Ho letto e accetto i ${link}.<span class="required-asterisk">*</span></label>
                </div>
            </div>`;
        }
        return html;
    };
    
    const generateStepsHtml = () => {
        if (!isMultiStep || totalSteps <= 1) return '';
        return sortedSteps.map((stepNum, index) => `
  <!-- STEP ${index + 1} -->
  <div class="form-step${index === 0 ? ' active' : ''}" data-step="${index + 1}">
    ${totalSteps > 1 ? `<h3 class="step-title">Passaggio ${index + 1} di ${totalSteps}</h3>` : ''}
    <div class="form-grid">
        ${fieldsByStep[stepNum].map(generateFieldHtml).join('')}
    </div>
    ${(index === totalSteps - 1) ? `<div class="consents-container">${generateConsentsHtml()}</div>` : ''}
    <div class="buttons">
      ${index > 0 ? '<button type="button" class="btn-secondary prev">Indietro</button>' : '<span></span>'}
      ${index < totalSteps - 1 ? '<button type="button" class="btn-primary next">Avanti</button>' : `<button type="submit" class="btn-primary">${submitButtonText || 'Invia Richiesta'}</button>`}
    </div>
  </div>`).join('');
    };
    
    const generateProgressBarHtml = () => {
        if (!isMultiStep || totalSteps <= 1) return '';
        return `
    <div class="progress-container">
        <div class="progress-bar" id="progressBar"></div>
        ${sortedSteps.map((stepNum, index) => `
        <div class="progress-step active" data-step-indicator="${index + 1}">${index + 1}</div>
        `).join('')}
    </div>`;
    };

    const formContentHtml = isMultiStep && totalSteps > 1 ? generateStepsHtml() : `
    <div class="form-grid">${fields.map(generateFieldHtml).join('')}</div>
    <div class="consents-container">${generateConsentsHtml()}</div>
    <div class="buttons">
      <span></span>
      <button type="submit" class="btn-primary">${submitButtonText || 'Invia Richiesta'}</button>
    </div>
    `;
    
    const titleHtml = showFormTitle ? `<h2>${formTitle || ''}</h2>` : '';

    return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${formTitle || `Richiedi informazioni - ${serviceName}`}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    /* Aggressive Reset within the unique wrapper */
    #${uniqueFormId}, #${uniqueFormId} * {
      all: revert;
      box-sizing: border-box;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    #${uniqueFormId} {
      --primary-color: ${primaryColor || '#3b82f6'};
      --button-text-color: ${buttonTextColor || '#ffffff'};
      --text-color: ${textColor || '#1e293b'};
      --label-color: ${labelColor || '#475569'};
      --form-bg: ${formBackgroundColor || '#ffffff'};

      --border-color: #cbd5e1;
      --border-color-light: #e2e8f0;
      --error-color: #ef4444;
      --success-color: #22c55e;
      --input-bg: #f8fafc;
      width: 100%;
      max-width: 700px;
      margin: 1rem auto;
    }
    
    #${uniqueFormId} form { 
      padding: 1.5rem;
      border: 1px solid var(--border-color-light);
      border-radius: 1rem;
      background: var(--form-bg);
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.07), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      overflow: hidden;
    }
    @media (min-width: 640px) { #${uniqueFormId} form { padding: 2.5rem; } }
    
    #${uniqueFormId} h2 { 
      margin: 0 0 2rem 0;
      padding: 0;
      color: var(--text-color);
      text-align: center;
      font-size: 1.75rem;
      font-weight: 700;
    }
    
    #${uniqueFormId} .form-grid {
      display: grid;
      grid-template-columns: 1fr; /* Mobile first: single column */
      gap: 1.25rem;
    }
    /* Tablet & Desktop: two columns */
    @media (min-width: 768px) { 
      #${uniqueFormId} .form-grid { 
        grid-template-columns: 1fr 1fr;
        gap: 1.25rem 1.5rem;
      } 
    }
    
    #${uniqueFormId} .form-group { display: flex; flex-direction: column; }
    
    #${uniqueFormId} label { 
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: var(--label-color);
      font-size: 0.875rem;
    }
    
    #${uniqueFormId} .required-asterisk { color: var(--error-color); }
    
    #${uniqueFormId} input, #${uniqueFormId} select, #${uniqueFormId} textarea { 
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      font-size: 1rem;
      background-color: var(--input-bg);
      transition: border-color 0.2s, box-shadow 0.2s;
      color: var(--text-color);
    }
    #${uniqueFormId} textarea { min-height: 100px; }
    
    #${uniqueFormId} input::placeholder { color: #94a3b8; }
    
    #${uniqueFormId} input:focus, #${uniqueFormId} select:focus, #${uniqueFormId} textarea:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 25%, transparent);
    }

    #${uniqueFormId} .radio-group label, #${uniqueFormId} .checkbox-group label { margin-bottom: 0.5rem; }
    #${uniqueFormId} .radio-options-wrapper { display: flex; flex-direction: column; gap: 0.75rem; }
    #${uniqueFormId} .radio-option, #${uniqueFormId} .checkbox-wrapper { display: flex; align-items: center; background-color: var(--input-bg); padding: 0.75rem; border-radius: 0.5rem; border: 1px solid var(--border-color); }
    #${uniqueFormId} .radio-option input, #${uniqueFormId} .checkbox-wrapper input { width: auto; margin-right: 0.75rem; }
    #${uniqueFormId} .radio-option label, #${uniqueFormId} .checkbox-wrapper label { margin-bottom: 0; font-weight: 400; font-size: 1rem; }
    #${uniqueFormId} input[type="radio"], #${uniqueFormId} input[type="checkbox"] { box-shadow: none; width: 1em; height: 1em; accent-color: var(--primary-color); }
    #${uniqueFormId} input[type="file"] { background-color: transparent; border: none; padding: 0; }
    #${uniqueFormId} select { -webkit-appearance: none; appearance: none; background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e"); background-position: right 0.5rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em; padding-right: 2.5rem; }
    
    /* Consent Styles */
    #${uniqueFormId} .consents-container { margin-top: 1.5rem; border-top: 1px solid var(--border-color-light); padding-top: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    #${uniqueFormId} .consent-group .checkbox-wrapper { padding: 0.5rem 0.75rem; }
    #${uniqueFormId} .consent-group label { font-size: 0.8rem; font-weight: normal; color: var(--label-color); }
    #${uniqueFormId} .consent-group a { color: var(--primary-color); text-decoration: underline; font-weight: 500; }
    #${uniqueFormId} .consent-group a:hover { filter: brightness(0.9); }
    
    #${uniqueFormId} button { 
      cursor: pointer;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 600;
      font-size: 1rem;
      border: 1px solid transparent;
      transition: all 0.2s ease;
      -webkit-appearance: none;
    }
    
    #${uniqueFormId} .btn-primary { background-color: var(--primary-color); color: var(--button-text-color); }
    #${uniqueFormId} .btn-primary:hover { filter: brightness(0.9); }
    #${uniqueFormId} .btn-secondary { background-color: var(--border-color-light); color: var(--label-color); }
    #${uniqueFormId} .btn-secondary:hover { background-color: var(--border-color); }
    #${uniqueFormId} button:disabled { opacity: 0.6; cursor: not-allowed; }
    
    #${uniqueFormId} .success-message { color: var(--success-color); font-weight: bold; text-align: center; }
    #${uniqueFormId} .error-message { color: var(--error-color); font-weight: bold; }
    #${uniqueFormId} #feedback { margin-top: 1.5rem; text-align: center; min-height: 1.5rem; font-size: 0.875rem; }
    
    #${uniqueFormId} .form-step { display:none; }
    #${uniqueFormId} .form-step.active { display:block; animation: fadeIn 0.4s ease-in-out; }
    
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    
    /* Step Title */
    #${uniqueFormId} .step-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
        color: var(--text-color);
        text-align: center;
    }
    
    /* Responsive Buttons */
    #${uniqueFormId} .buttons { 
      display: flex;
      flex-direction: column-reverse; /* Stack on mobile, primary button on top */
      gap: 0.75rem; 
      margin-top: 2rem; 
      border-top: 1px solid var(--border-color-light); 
      padding-top: 1.5rem; 
    }
    #${uniqueFormId} .buttons button {
      width: 100%;
    }
    #${uniqueFormId} .buttons span {
      display: none; /* Hide spacer on mobile */
    }
    @media (min-width: 640px) { 
      #${uniqueFormId} .buttons {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
      }
      #${uniqueFormId} .buttons button {
        width: auto;
      }
      #${uniqueFormId} .buttons span {
        display: block; /* Show spacer on desktop */
      }
    }
    
    /* Progress Bar */
    #${uniqueFormId} .progress-container { position: relative; display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
    #${uniqueFormId} .progress-container::before { content: ''; position: absolute; top: 50%; transform: translateY(-50%); height: 4px; width: 100%; background-color: var(--border-color-light); z-index: 1; }
    #${uniqueFormId} .progress-bar { position: absolute; top: 50%; transform: translateY(-50%); height: 4px; width: 0%; background-color: var(--primary-color); z-index: 2; transition: width 0.4s ease; }
    #${uniqueFormId} .progress-step { width: 30px; height: 30px; background-color: white; border: 3px solid var(--border-color-light); border-radius: 50%; z-index: 3; display: flex; justify-content: center; align-items: center; font-weight: bold; color: var(--label-color); transition: all 0.4s ease; }
    #${uniqueFormId} .progress-step.active { border-color: var(--primary-color); background-color: var(--primary-color); color: white; }
  </style>
</head>
<body>
<div id="${uniqueFormId}">
  <form id="leadForm" novalidate>
    ${titleHtml}
    ${generateProgressBarHtml()}
    ${formContentHtml}
    <div id="feedback"></div>
  </form>
</div>
<script type="module">
  import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

  const SUPABASE_URL = '${supabaseUrl}';
  const SUPABASE_ANON_KEY = '${supabaseAnonKey}';
  const CLIENT_ID = '${client.id}';
  const SERVICE_NAME = '${serviceName}';
  const THANK_YOU_PAGE_URL = '${thankYouUrl}';
  const WEBHOOK_URL = '${webhookUrl}';

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  const formWrapper = document.getElementById('${uniqueFormId}');
  const form = formWrapper.querySelector('#leadForm');
  const feedback = formWrapper.querySelector('#feedback');
  const steps = formWrapper.querySelectorAll(".form-step");
  const submitButton = form.querySelector('button[type="submit"]');
  let currentStep = 1;

  function updateProgressBar() {
    const progressSteps = formWrapper.querySelectorAll('.progress-step');
    const progressBar = formWrapper.querySelector('#progressBar');
    if (!progressSteps.length || !progressBar) return;

    progressSteps.forEach((stepEl, index) => {
      if (index < currentStep) {
        stepEl.classList.add('active');
      } else {
        stepEl.classList.remove('active');
      }
    });

    const activeSteps = formWrapper.querySelectorAll('.progress-step.active');
    const width = (activeSteps.length - 1) / (progressSteps.length - 1) * 100;
    progressBar.style.width = \`\${width}%\`;
  }

  function showStep(stepIndex) {
    if (steps.length === 0) return;
    const stepToShow = form.querySelector(\`.form-step[data-step="\${stepIndex}"]\`);
    if(stepToShow) {
        steps.forEach(step => step.classList.remove("active"));
        stepToShow.classList.add("active");
        currentStep = stepIndex;
        updateProgressBar();
    }
  }

  function validateStep(stepIndex) {
      const currentStepElement = form.querySelector(\`.form-step[data-step="\${stepIndex}"]\`);
      const inputs = currentStepElement.querySelectorAll('input[required], select[required], textarea[required]');
      let isValid = true;
      inputs.forEach(input => {
          if (input.type === 'radio' || input.type === 'checkbox') {
              if (input.required) {
                  const name = input.name;
                  if (!form.querySelector(\`input[name="\${name}"]:checked\`)) {
                      isValid = false;
                  }
              }
          } else if (!input.value.trim()) {
              isValid = false;
              input.style.borderColor = 'var(--error-color)';
          } else {
              input.style.borderColor = 'var(--border-color)';
          }
      });
      if (!isValid) feedback.textContent = 'Per favore, compila tutti i campi obbligatori.';
      else feedback.textContent = '';
      return isValid;
  }
  
  function validateAll() {
      const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
      let isValid = true;
      inputs.forEach(input => {
          if (input.type === 'checkbox') {
               if (input.required && !input.checked) {
                    isValid = false;
                    const wrapper = input.closest('.checkbox-wrapper, .consent-group');
                    if (wrapper) wrapper.style.borderColor = 'var(--error-color)';
               } else {
                    const wrapper = input.closest('.checkbox-wrapper, .consent-group');
                    if (wrapper) wrapper.style.borderColor = 'var(--border-color)';
               }
          } else if (!input.value.trim()) {
              isValid = false;
              input.style.borderColor = 'var(--error-color)';
          } else {
              input.style.borderColor = 'var(--border-color)';
          }
      });
      if (!isValid) feedback.textContent = 'Per favore, compila tutti i campi obbligatori.';
      else feedback.textContent = '';
      return isValid;
  }

  form.addEventListener("click", e => {
    if (e.target.matches(".next")) {
      if (validateStep(currentStep) && currentStep < steps.length) {
        showStep(currentStep + 1);
      }
    } else if (e.target.matches(".prev")) {
      if (currentStep > 1) {
        showStep(currentStep - 1);
      }
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (steps.length > 0) { // Multi-step validation
        if (!validateStep(currentStep)) return;
    } else { // Single-step validation
        if (!validateAll()) return;
    }

    feedback.textContent = '';
    feedback.className = '';
    if(submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Invio...';
    }
    
    const formData = new FormData(form);
    const dataJson = {};
    const consentKeys = ['privacy_policy_consent', 'terms_consent'];
    formData.forEach((value, key) => { 
        if (!consentKeys.includes(key)) {
            dataJson[key] = value; 
        }
    });

    try {
      // Fetch IP address
      let ip_address = 'N/A';
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        if (ipResponse.ok) {
            const ipData = await ipResponse.json();
            ip_address = ipData.ip;
        }
      } catch (ipError) {
        console.error('Could not fetch IP address:', ipError);
      }
      
      // Add extra data to the 'data' JSON object
      dataJson.ip_address = ip_address;
      dataJson.user_agent = navigator.userAgent;
      
      // Capture exact submission time
      const submissionTime = new Date().toISOString();

      const { error } = await supabase.from('leads').insert([{
        client_id: CLIENT_ID,
        data: dataJson,
        service: SERVICE_NAME,
        status: 'Nuovo',
        created_at: submissionTime
      }]);

      if (error) {
        throw new Error(error.message);
      }

      if (WEBHOOK_URL) {
        try {
          await fetch(WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...dataJson, client_id: CLIENT_ID, service: SERVICE_NAME, created_at: submissionTime })
          });
        } catch (webhookError) {
            // We log the error but don't stop the user flow, as the lead is already saved.
            console.error('Webhook request failed:', webhookError);
        }
      }
      
      if (THANK_YOU_PAGE_URL) {
          window.location.href = THANK_YOU_PAGE_URL;
      } else {
          formWrapper.innerHTML = \`<div class="success-message" style="text-align: center; padding: 2rem;"><h2>✅ Grazie!</h2><p>I tuoi dati sono stati inviati con successo.</p></div>\`;
      }

    } catch (err) {
      console.error(err);
      feedback.textContent = '❌ Errore durante l’invio. Riprova.';
      feedback.className = 'error-message';
      if(submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = '${submitButtonText || 'Invia Richiesta'}';
      }
    }
  });
  
  if (steps.length > 0) showStep(1);
</script>
</body>
</html>`;
}