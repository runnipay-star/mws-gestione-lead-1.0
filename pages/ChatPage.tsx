import React from 'react';
import { MessageSquare } from 'lucide-react';

// Aggiunta dell'icona di WhatsApp come componente SVG per un migliore aspetto visivo
const WhatsAppIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="mr-3">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.235 3.487 8.413 0 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 4.315 1.731 6.086l.287.468-1.03 3.727 3.75-1.025.45.29c1.693 1.054 3.543 1.599 5.576 1.6z"/>
    </svg>
);


const ChatPage: React.FC = () => {
    // Numeri di telefono per il contatto WhatsApp (senza + o spazi)
    const phoneNumberIT = "393772334192";
    const phoneNumberOther = "40793553565";
    // Messaggio precompilato per facilitare il primo contatto
    const message = encodeURIComponent("Ciao, avrei bisogno di assistenza per la piattaforma MWS Gestione Lead.");
    const whatsappLinkIT = `https://wa.me/${phoneNumberIT}?text=${message}`;
    const whatsappLinkOther = `https://wa.me/${phoneNumberOther}?text=${message}`;

    return (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 max-w-4xl mx-auto">
            <div className="flex items-center space-x-3 mb-6">
                <MessageSquare className="w-8 h-8 text-primary-500 dark:text-primary-400" />
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Assistenza e Supporto</h2>
            </div>
            <div className="space-y-8 text-slate-600 dark:text-gray-300">
                
                <div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Contattaci su WhatsApp</h3>
                    <p className="mb-4">
                        Per un'assistenza rapida e diretta, puoi contattarci tramite WhatsApp. Scegli il contatto appropriato per avviare una chat con il nostro team di supporto.
                    </p>
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                        <a
                            href={whatsappLinkIT}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-green-500 transition-transform transform hover:scale-105 shadow-lg"
                            aria-label="Contatta il supporto in Italiano su WhatsApp"
                        >
                            <WhatsAppIcon />
                            Supporto (Italiano)
                        </a>
                         <a
                            href={whatsappLinkOther}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-green-500 transition-transform transform hover:scale-105 shadow-lg"
                            aria-label="Contatta il supporto per altre lingue su WhatsApp"
                        >
                            <WhatsAppIcon />
                            Supporto (Altre Lingue)
                        </a>
                    </div>
                </div>
                
                <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">Chat Interna</h3>
                     <p className="mb-4">
                        Stiamo lavorando per integrare una chat direttamente all'interno della piattaforma per le comunicazioni future.
                    </p>
                    <div className="p-4 bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-md">
                        <p>
                           La funzionalità di chat interna è in fase di sviluppo e sarà disponibile prossimamente.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ChatPage;