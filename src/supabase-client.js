const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class SupabaseClient {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
    }

    // Get all drugs with their current PK data status
    async getAllDrugs() {
        const { data, error } = await this.supabase
            .from('drugs')
            .select('*')
            .order('drug_name');
        
        if (error) throw error;
        return data;
    }

    // Get drugs missing specific data
    async getDrugsMissingData(field) {
        const { data, error } = await this.supabase
            .from('drugs')
            .select('*')
            .is(field, null)
            .order('drug_name');
        
        if (error) throw error;
        return data;
    }

    // Get drugs with incomplete Cmax data
    async getDrugsMissingCmax() {
        const { data, error } = await this.supabase
            .from('drugs')
            .select('*')
            .or('cmax_oral_mg_l.is.null,cmax_iv_mg_l.is.null')
            .order('drug_name');
        
        if (error) throw error;
        return data;
    }

    // Update drug data
    async updateDrug(drugId, updates) {
        const { data, error } = await this.supabase
            .from('drugs')
            .update(updates)
            .eq('id', drugId)
            .select();
        
        if (error) throw error;
        return data[0];
    }

    // Get drug by name
    async getDrugByName(drugName) {
        const { data, error } = await this.supabase
            .from('drugs')
            .select('*')
            .ilike('drug_name', drugName)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    // Get completion statistics
    async getCompletionStats() {
        const { data: allDrugs } = await this.supabase
            .from('drugs')
            .select('id, drug_name, cmax_oral_mg_l, cmax_iv_mg_l, cmax_topical_mg_l, half_life_hours, tmax_hours, auc_mg_h_l, therapeutic_range_min, therapeutic_range_max');

        if (!allDrugs) return null;

        const stats = {
            total: allDrugs.length,
            withAnyCmax: 0,
            withOralCmax: 0,
            withIvCmax: 0,
            withTopicalCmax: 0,
            withHalfLife: 0,
            withTimingData: 0,
            withTherapeuticRange: 0,
            withCompletePkProfile: 0
        };

        allDrugs.forEach(drug => {
            if (drug.cmax_oral_mg_l || drug.cmax_iv_mg_l || drug.cmax_topical_mg_l) {
                stats.withAnyCmax++;
            }
            if (drug.cmax_oral_mg_l) stats.withOralCmax++;
            if (drug.cmax_iv_mg_l) stats.withIvCmax++;
            if (drug.cmax_topical_mg_l) stats.withTopicalCmax++;
            if (drug.half_life_hours) stats.withHalfLife++;
            if (drug.tmax_hours && drug.auc_mg_h_l) stats.withTimingData++;
            if (drug.therapeutic_range_min && drug.therapeutic_range_max) stats.withTherapeuticRange++;
            if ((drug.cmax_oral_mg_l || drug.cmax_iv_mg_l) && drug.half_life_hours) {
                stats.withCompletePkProfile++;
            }
        });

        return stats;
    }

    // Test connection
    async testConnection() {
        try {
            const { data, error } = await this.supabase
                .from('drugs')
                .select('count')
                .limit(1);
            
            if (error) throw error;
            return { success: true, message: 'Connected to Supabase successfully' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = SupabaseClient;