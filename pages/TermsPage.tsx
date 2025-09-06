
import React from 'react';
import { FileText } from 'lucide-react';

const TermsPage: React.FC = () => {
    return (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 max-w-4xl mx-auto">
            <div className="flex items-center space-x-3 mb-6">
                <FileText className="w-8 h-8 text-primary-500 dark:text-primary-400" />
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Termini e Condizioni</h2>
            </div>
            <div className="space-y-4 text-slate-600 dark:text-gray-300">
                <h4 className="text-lg font-semibold text-slate-800 dark:text-white">1. Accettazione dei Termini</h4>
                <p>
                    Utilizzando la Piattaforma Gestione Lead ("Servizio"), l'utente accetta di essere vincolato dai seguenti termini e condizioni ("Termini di Servizio").
                </p>
                <h4 className="text-lg font-semibold text-slate-800 dark:text-white">2. Descrizione del Servizio</h4>
                <p>
                    Il Servizio fornisce strumenti per la gestione dei lead dei clienti, inclusa l'acquisizione tramite webhook, la categorizzazione e l'analisi dei dati. Ci riserviamo il diritto di modificare o interrompere il Servizio con o senza preavviso.
                </p>
                 <h4 className="text-lg font-semibold text-slate-800 dark:text-white">3. Account Utente</h4>
                <p>
                    L'utente è responsabile della salvaguardia della password utilizzata per accedere al Servizio e di qualsiasi attività o azione effettuata con la propria password. È necessario notificarci immediatamente qualsiasi violazione della sicurezza o uso non autorizzato del proprio account.
                </p>
                 <h4 className="text-lg font-semibold text-slate-800 dark:text-white">4. Limitazione di Responsabilità</h4>
                <p>
                   In nessun caso Moise Web Lead Platform sarà responsabile per danni indiretti, incidentali, speciali, consequenziali o punitivi, inclusi, senza limitazione, perdita di profitti, dati, uso, avviamento o altre perdite immateriali.
                </p>
            </div>
        </div>
    );
};

export default TermsPage;