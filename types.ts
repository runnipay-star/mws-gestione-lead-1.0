export type AdSpendPlatform = 'Meta' | 'Google' | 'TikTok';

export interface AdSpend {
    id: string;
    client_id?: string;
    service: string;
    platform: AdSpendPlatform;
    amount: number;
    start_date: string; // YYYY-MM-DD
    end_date: string; // YYYY-MM-DD
    created_at?: string;
}

export interface User {
    id: string;
    username: string;
    password?: string;
    role: 'admin' | 'client';
    email?: string;
    phone?: string;
    status: 'active' | 'suspended';
    created_at?: string;
}

export interface Note {
    id: string;
    lead_id?: string;
    content: string;
    created_at: string;
}

export type LeadFieldType =
  | 'text'
  | 'email'
  | 'textarea'
  | 'url'
  | 'tel'
  | 'radio'
  | 'select'
  | 'checkbox'
  | 'number'
  | 'date'
  | 'time'
  | 'file'
  | 'password';

export interface LeadField {
    id: string;
    name: string;
    label: string;
    type: LeadFieldType;
    options?: string[];
    required?: boolean;
}

export interface Service {
    id:string;
    name: string;
    fields: LeadField[];
}

export interface Lead {
    id: string;
    client_id?: string;
    created_at: string;
    data: Record<string, string>;
    status: 'Nuovo' | 'Contattato' | 'In Lavorazione' | 'Perso' | 'Vinto';
    value?: number;
    service?: string;
    notes?: Note[];
}

export interface Client {
    id: string;
    name: string;
    user_id: string;
    services: Service[];
    created_at?: string;
    // These are loaded separately
    leads: Lead[];
    adSpends?: AdSpend[];
}
// FIX: Added SavedForm and SavedFormConfig types to resolve error in SavedFormsModule.
export interface SavedFormConfig {
    externalWebhookUrl: string;
    thankYouUrl: string;
    isMultiStep: boolean;
    fieldSteps: Record<string, number>;
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

export interface SavedForm {
    id: string;
    name: string;
    client_id: string;
    service_name: string;
    config: SavedFormConfig;
    created_at: string;
}