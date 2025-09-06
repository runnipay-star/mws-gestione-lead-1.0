import { supabase } from '../supabaseClient';
// FIX: Imported SavedForm type to be used in new API methods.
import type { User, Client, Lead, Note, AdSpend, Service, SavedForm } from '../types';

interface AddLeadOptions {
    clientId: string;
    leadData: Record<string, string>;
    service?: string;
    status?: Lead['status'];
    value?: number;
}

export class ApiService {

    static async login(username: string, password?: string): Promise<User | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();

        if (error) {
            console.error("Login error:", error.message);
            return null;
        }
        
        if (data?.status === 'suspended') {
            throw new Error('Questo account è stato sospeso.');
        }

        if (data) {
            const { password, ...userWithoutPassword } = data;
            return userWithoutPassword as User;
        }

        return null;
    }

    static async getClients(): Promise<Client[]> {
        const { data: clientsData, error: clientsError } = await supabase
            .from('clients')
            .select('*');

        if (clientsError) throw new Error(clientsError.message);

        const clientIds = clientsData.map(c => c.id);

        const { data: leadsData, error: leadsError } = await supabase
            .from('leads')
            .select('*, notes(*)')
            .in('client_id', clientIds);

        if (leadsError) throw new Error(leadsError.message);

        const { data: spendsData, error: spendsError } = await supabase
            .from('ad_spends')
            .select('*')
            .in('client_id', clientIds);
        
        if (spendsError) throw new Error(spendsError.message);

        return clientsData.map(client => ({
            ...client,
            leads: (leadsData?.filter(l => l.client_id === client.id) || []) as Lead[],
            adSpends: spendsData?.filter(s => s.client_id === client.id) as AdSpend[],
            // Supabase returns services as string, parse it
            services: typeof client.services === 'string' ? JSON.parse(client.services) : client.services || []
        }));
    }

    static async getUsers(): Promise<User[]> {
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw new Error(error.message);
        return data as User[];
    }

    static async getClientByUserId(userId: string): Promise<Client | null> {
        const { data: client, error } = await supabase
            .from('clients')
            .select('*')
            .eq('user_id', userId)
            .single();
            
        if (error || !client) {
             console.error("Error fetching client by user ID", error?.message);
             return null;
        }

        const [{data: leads}, {data: spends}] = await Promise.all([
             supabase.from('leads').select('*, notes(*)').eq('client_id', client.id),
             supabase.from('ad_spends').select('*').eq('client_id', client.id)
        ]);

        return {
            ...client,
            leads: (leads || []) as Lead[],
            adSpends: (spends || []) as AdSpend[],
            services: typeof client.services === 'string' ? JSON.parse(client.services) : client.services || []
        };
    }
    
    static async addClient(name: string, username: string, password: string, services: Omit<Service, 'id'>[]): Promise<Client> {
        // Check for existing username
        const { data: existingUser } = await supabase.from('users').select('id').eq('username', username).single();
        if (existingUser) throw new Error('Username già esistente.');

        if (!password || password.trim().length === 0) {
            throw new Error('La password è obbligatoria e non può essere vuota.');
        }

        // 1. Insert user
        const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert({ username, password, role: 'client', status: 'active' })
            .select()
            .single();
        
        if (userError) throw new Error(userError.message);

        // 2. Insert client
        const servicesWithIds = services.map(s => ({
            ...s,
            id: `service_${Date.now()}_${Math.random()}`,
            fields: s.fields.map(f => ({ ...f, id: `field_${Date.now()}_${Math.random()}` }))
        }));
        
        const { data: newClient, error: clientError } = await supabase
            .from('clients')
            .insert({ name, user_id: newUser.id, services: servicesWithIds })
            .select()
            .single();

        if (clientError) {
            // Rollback user creation if client fails
            await supabase.from('users').delete().eq('id', newUser.id);
            throw new Error(clientError.message);
        }

        return { ...newClient, leads: [], adSpends: [], services: newClient.services || [] } as Client;
    }

    static async updateClient(clientId: string, updates: Partial<Pick<Client, 'name' | 'services'>>): Promise<Client> {
        const { data, error } = await supabase
            .from('clients')
            .update(updates)
            .eq('id', clientId)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return { ...data, leads: [], adSpends: [], services: data.services || [] };
    }
    
    static async deleteClient(clientId: string): Promise<void> {
        // Find user_id first to delete the user
        const { data: client, error: findError } = await supabase.from('clients').select('user_id').eq('id', clientId).single();
        if(findError) throw new Error(findError.message);
        if(!client) throw new Error("Cliente non trovato");

        // ON DELETE CASCADE will handle deleting the client, leads, etc.
        const { error } = await supabase.from('users').delete().eq('id', client.user_id);
        if (error) throw new Error(error.message);
    }
    
    static async deleteClientByUserId(userId: string): Promise<void> {
        const { error } = await supabase.from('users').delete().eq('id', userId);
        if (error) throw new Error(error.message);
    }

    static async addLead({ clientId, leadData, service, status, value }: AddLeadOptions): Promise<Lead> {
        const leadToInsert = {
            client_id: clientId,
            data: leadData,
            service,
            status: status || 'Nuovo',
            value
        };
        const { data, error } = await supabase.from('leads').insert(leadToInsert).select().single();
        if (error) throw new Error(error.message);
        return data as Lead;
    }

    static async updateLead(clientId: string, leadId: string, updates: Partial<Lead>): Promise<Lead> {
        // We don't need clientId for Supabase update, but keep it for consistency
        const { data, error } = await supabase.from('leads').update(updates).eq('id', leadId).select().single();
        if (error) throw new Error(error.message);
        return data as Lead;
    }

    static async deleteLead(clientId: string, leadId: string): Promise<void> {
        const { error } = await supabase.from('leads').delete().eq('id', leadId);
        if (error) throw new Error(error.message);
    }

    static async deleteMultipleLeads(leadsToDelete: {clientId: string, leadId: string}[]): Promise<void> {
        const leadIds = leadsToDelete.map(l => l.leadId);
        const { error } = await supabase.from('leads').delete().in('id', leadIds);
        if (error) throw new Error(error.message);
    }
    
    static async addNoteToLead(clientId: string, leadId: string, noteContent: string): Promise<Lead> {
        const { error } = await supabase.from('notes').insert({ lead_id: leadId, content: noteContent });
        if (error) throw new Error(error.message);
        
        // Fetch the lead again with the new note
        const { data: updatedLeadData, error: leadError } = await supabase
            .from('leads')
            .select('*, notes(*)')
            .eq('id', leadId)
            .single();
        if(leadError) throw new Error(leadError.message);
        
        return updatedLeadData as Lead;
    }

    static async getUserById(userId: string): Promise<User | null> {
        const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
        if (error) return null;
        return data as User;
    }

    static async updateUser(userId: string, updates: Partial<Pick<User, 'username' | 'password' | 'email' | 'phone'>>, currentPassword?: string): Promise<User> {
        if (currentPassword) {
            const { data: user, error } = await supabase.from('users').select('password').eq('id', userId).single();
            if (error || !user || user.password !== currentPassword) {
                throw new Error('La password attuale non è corretta.');
            }
        }
        
        if (updates.username) {
             const { data: existing, error } = await supabase.from('users').select('id').eq('username', updates.username).not('id', 'eq', userId).single();
             if(existing) throw new Error('Username già esistente.');
        }

        if (updates.password === '' || updates.password === null || updates.password === undefined) {
            delete updates.password;
        }

        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (updateError) throw new Error(updateError.message);

        const { password, ...userWithoutPassword } = updatedUser;
        return userWithoutPassword as User;
    }
    
    static async updateUserStatus(userId: string, status: User['status']): Promise<User> {
        const { data, error } = await supabase.from('users').update({ status }).eq('id', userId).select().single();
        if(error) throw new Error(error.message);
        const { password, ...userWithoutPassword } = data;
        return userWithoutPassword as User;
    }

    // --- Ad Spend Methods ---
    static async addAdSpend(clientId: string, spendData: Omit<AdSpend, 'id' | 'client_id' | 'created_at'>): Promise<AdSpend> {
        const { data, error } = await supabase
            .from('ad_spends')
            .insert({ client_id: clientId, ...spendData })
            .select()
            .single();
        if (error) throw new Error(error.message);
        return data as AdSpend;
    }

    static async updateAdSpend(clientId: string, spendId: string, updates: Partial<Omit<AdSpend, 'id'>>): Promise<AdSpend> {
        const { data, error } = await supabase.from('ad_spends').update(updates).eq('id', spendId).select().single();
        if(error) throw new Error(error.message);
        return data as AdSpend;
    }

    static async deleteAdSpend(clientId: string, spendId: string): Promise<void> {
        const { error } = await supabase.from('ad_spends').delete().eq('id', spendId);
        if(error) throw new Error(error.message);
    }

    // FIX: Added getForms and deleteForm methods to resolve errors in SavedFormsModule.
    // --- Saved Form Methods ---
    static async getForms(): Promise<SavedForm[]> {
        const { data, error } = await supabase.from('saved_forms').select('*');
        if (error) throw new Error(error.message);
        return data as SavedForm[];
    }

    static async deleteForm(formId: string): Promise<void> {
        const { error } = await supabase.from('saved_forms').delete().eq('id', formId);
        if (error) throw new Error(error.message);
    }
}