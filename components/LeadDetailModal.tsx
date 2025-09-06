
import React, { useState } from 'react';
import Modal from './Modal';
import type { Lead, Client } from '../types';
import { Tag, Calendar, User, Info, DollarSign, Briefcase, MessageCircle, History } from 'lucide-react';

interface LeadDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead | null;
    client?: Client | null;
    historicalLeads?: Lead[];
    onAddNote?: (clientId: string, leadId: string, note: string) => Promise<void>;
}

const statusColors: Record<Lead['status'], string> = {
    'Nuovo': 'bg-slate-500 dark:bg-slate-600 text-white',
    'Contattato': 'bg-yellow-400 dark:bg-yellow-500 text-slate-800 dark:text-black',
    'In Lavorazione': 'bg-purple-400 dark:bg-purple-500 text-white',
    'Perso': 'bg-red-500 text-white',
    'Vinto': 'bg-green-500 text-white',
};

const DetailRow: React.FC<{ icon: React.ReactNode, label: string, value: React.ReactNode }> = ({ icon, label, value }) => (
    <div className="flex items-start py-3">
        <div className="flex items-center w-1/3 text-sm text-gray-500 dark:text-gray-400">
            {icon}
            <span className="ml-2 font-medium">{label}</span>
        </div>
        <div className="w-2/3 text-sm text-slate-800 dark:text-white font-semibold">
            {value}
        </div>
    </div>
);

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ isOpen, onClose, lead, client, historicalLeads, onAddNote }) => {
    const [newNote, setNewNote] = useState('');
    const [isSubmittingNote, setIsSubmittingNote] = useState(false);

    if (!isOpen || !lead) return null;
    
    const getFieldLabel = (key: string) => {
        if (client) {
            for (const service of client.services) {
                const field = service.fields.find(f => f.name === key);
                if (field) return field.label;
            }
        }
        return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
    }

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim() || !client || !onAddNote) return;

        setIsSubmittingNote(true);
        try {
            await onAddNote(client.id, lead.id, newNote);
            setNewNote('');
        } catch (error) {
            console.error("Error adding note in modal:", error);
        } finally {
            setIsSubmittingNote(false);
        }
    };
    
    const technicalFields = ['ip_address', 'user_agent'];
    const mainDataEntries = Object.entries(lead.data).filter(([key]) => !technicalFields.includes(key));
    const techDataEntries = Object.entries(lead.data).filter(([key]) => technicalFields.includes(key));
    const allSortedEntries = [...mainDataEntries, ...techDataEntries];


    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Dettagli Lead: ${lead.data.nome || 'N/D'}`}>
            <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Dati Forniti</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        {allSortedEntries.map(([key, value]) => (
                            <div key={key} className="py-2 border-b border-slate-200/80 dark:border-slate-700/80">
                                <p className="text-sm text-gray-500 dark:text-gray-400">{getFieldLabel(key)}</p>
                                <p className="font-semibold text-slate-800 dark:text-white break-words">
                                    {value || <span className="text-gray-500 font-normal italic">N/D</span>}
                                </p>
                            </div>
                        ))}
                     </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Riepilogo</h3>
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {client && (
                            <DetailRow
                                icon={<Briefcase size={16} className="text-primary-500 dark:text-primary-400" />}
                                label="Cliente"
                                value={client.name}
                            />
                        )}
                         <DetailRow
                            icon={<Calendar size={16} className="text-primary-500 dark:text-primary-400" />}
                            label="Data Ricezione"
                            value={new Date(lead.created_at).toLocaleString('it-IT')}
                        />
                         <DetailRow
                            icon={<Tag size={16} className="text-primary-500 dark:text-primary-400" />}
                            label="Servizio"
                            value={lead.service || <span className="text-gray-500">Non specificato</span>}
                        />
                         <DetailRow
                            icon={<Info size={16} className="text-primary-500 dark:text-primary-400" />}
                            label="Stato"
                            value={<span className={`px-2 py-1 text-xs font-bold rounded-full ${statusColors[lead.status]}`}>{lead.status}</span>}
                        />
                         <DetailRow
                            icon={<DollarSign size={16} className="text-primary-500 dark:text-primary-400" />}
                            label="Valore"
                            value={lead.value ? `€ ${lead.value.toLocaleString('it-IT')}` : <span className="text-gray-500">Non definito</span>}
                        />
                    </div>
                </div>

                {historicalLeads && historicalLeads.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                        <h3 className="flex items-center text-lg font-semibold text-slate-900 dark:text-white mb-3">
                            <History size={18} className="mr-2 text-primary-500 dark:text-primary-400"/>
                            Storico Richieste
                        </h3>
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                            {historicalLeads.map(hLead => (
                                <div key={hLead.id} className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-sm border border-slate-200 dark:border-slate-700/50">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold text-slate-700 dark:text-gray-300">{hLead.service || 'Servizio non specificato'}</p>
                                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${statusColors[hLead.status]}`}>{hLead.status}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 text-left mt-1">{new Date(hLead.created_at).toLocaleString('it-IT')}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="flex items-center text-lg font-semibold text-slate-900 dark:text-white mb-3">
                        <MessageCircle size={18} className="mr-2 text-primary-500 dark:text-primary-400"/>
                        Note
                    </h3>
                    {onAddNote && (
                        <form onSubmit={handleAddNote} className="mb-4">
                            <textarea
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Aggiungi una nuova nota..."
                                className="w-full h-20 p-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                disabled={isSubmittingNote}
                            />
                            <div className="text-right mt-2">
                                <button type="submit" disabled={isSubmittingNote || !newNote.trim()} className="bg-primary-600 text-white px-4 py-2 text-sm rounded-lg shadow hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isSubmittingNote ? 'Aggiungendo...' : 'Aggiungi Nota'}
                                </button>
                            </div>
                        </form>
                    )}
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {lead.notes && lead.notes.length > 0 ? (
                            lead.notes.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(note => (
                                <div key={note.id} className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-sm border border-slate-200 dark:border-slate-700/50">
                                    <p className="text-slate-700 dark:text-gray-300 whitespace-pre-wrap">{note.content}</p>
                                    <p className="text-xs text-gray-500 text-right mt-1">{new Date(note.created_at).toLocaleString('it-IT')}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">Nessuna nota presente.</p>
                        )}
                    </div>
                </div>
            </div>
             <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                <button onClick={onClose} className="bg-slate-500 dark:bg-slate-600 text-white px-4 py-2 rounded-lg shadow hover:bg-slate-600 dark:hover:bg-slate-500 transition-colors">
                    Chiudi
                </button>
            </div>
        </Modal>
    );
};

export default LeadDetailModal;
