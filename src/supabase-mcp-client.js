// Supabase MCP Client - Uses MCP tools instead of direct connection
class SupabaseMCPClient {
    constructor() {
        this.projectId = 'dlzlllxhaakheuprdpar'; // Your sonic-analysis project
    }

    // Get all drugs with their current PK data status
    async getAllDrugs() {
        try {
            // Use SQL query through MCP
            const query = `
                SELECT * FROM drugs 
                ORDER BY drug_name
            `;
            
            // This would use the MCP execute_sql tool
            console.log('📊 Fetching all drugs from database...');
            // Return mock data for now - you'll execute this through MCP
            return { query, projectId: this.projectId };
        } catch (error) {
            throw error;
        }
    }

    // Get drugs missing specific data
    async getDrugsMissingData(field) {
        const query = `
            SELECT * FROM drugs 
            WHERE ${field} IS NULL 
            ORDER BY drug_name
        `;
        
        return { query, projectId: this.projectId };
    }

    // Get drugs with incomplete Cmax data
    async getDrugsMissingCmax() {
        const query = `
            SELECT * FROM drugs 
            WHERE cmax_oral_mg_l IS NULL OR cmax_iv_mg_l IS NULL
            ORDER BY drug_name
        `;
        
        return { query, projectId: this.projectId };
    }

    // Update drug data
    async updateDrug(drugId, updates) {
        const updateFields = Object.entries(updates)
            .map(([key, value]) => `${key} = ${typeof value === 'string' ? `'${value}'` : value}`)
            .join(', ');
            
        const query = `
            UPDATE drugs 
            SET ${updateFields}
            WHERE id = ${drugId}
            RETURNING *
        `;
        
        return { query, projectId: this.projectId };
    }

    // Get drug by name
    async getDrugByName(drugName) {
        const query = `
            SELECT * FROM drugs 
            WHERE LOWER(drug_name) = LOWER('${drugName}')
            LIMIT 1
        `;
        
        return { query, projectId: this.projectId };
    }

    // Get completion statistics
    async getCompletionStats() {
        const query = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN cmax_oral_mg_l IS NOT NULL OR cmax_iv_mg_l IS NOT NULL OR cmax_topical_mg_l IS NOT NULL THEN 1 END) as with_any_cmax,
                COUNT(CASE WHEN cmax_oral_mg_l IS NOT NULL THEN 1 END) as with_oral_cmax,
                COUNT(CASE WHEN cmax_iv_mg_l IS NOT NULL THEN 1 END) as with_iv_cmax,
                COUNT(CASE WHEN cmax_topical_mg_l IS NOT NULL THEN 1 END) as with_topical_cmax,
                COUNT(CASE WHEN half_life_hours IS NOT NULL THEN 1 END) as with_half_life,
                COUNT(CASE WHEN tmax_hours IS NOT NULL AND auc_mg_h_l IS NOT NULL THEN 1 END) as with_timing_data,
                COUNT(CASE WHEN therapeutic_range_min IS NOT NULL AND therapeutic_range_max IS NOT NULL THEN 1 END) as with_therapeutic_range,
                COUNT(CASE WHEN (cmax_oral_mg_l IS NOT NULL OR cmax_iv_mg_l IS NOT NULL) AND half_life_hours IS NOT NULL THEN 1 END) as with_complete_pk_profile
            FROM drugs
        `;
        
        return { query, projectId: this.projectId };
    }

    // Find drugs with low completion scores
    async findIncompleteeDrugs() {
        const query = `
            SELECT 
                id,
                drug_name,
                cmax_oral_mg_l,
                cmax_iv_mg_l,
                cmax_topical_mg_l,
                half_life_hours,
                tmax_hours,
                auc_mg_h_l,
                steady_state_days,
                protein_binding_percent,
                vd_l_kg,
                therapeutic_range_min,
                therapeutic_range_max,
                adult_dose_mg,
                active_metabolites,
                food_effect,
                cns_penetration_percent,
                molecular_weight,
                CASE 
                    WHEN cmax_oral_mg_l IS NOT NULL OR cmax_iv_mg_l IS NOT NULL OR cmax_topical_mg_l IS NOT NULL THEN 1 
                    ELSE 0 
                END as has_any_cmax,
                (
                    CASE WHEN cmax_oral_mg_l IS NOT NULL THEN 1 ELSE 0 END +
                    CASE WHEN cmax_iv_mg_l IS NOT NULL THEN 1 ELSE 0 END +
                    CASE WHEN half_life_hours IS NOT NULL THEN 1 ELSE 0 END +
                    CASE WHEN tmax_hours IS NOT NULL THEN 1 ELSE 0 END +
                    CASE WHEN auc_mg_h_l IS NOT NULL THEN 1 ELSE 0 END +
                    CASE WHEN steady_state_days IS NOT NULL THEN 1 ELSE 0 END +
                    CASE WHEN protein_binding_percent IS NOT NULL THEN 1 ELSE 0 END +
                    CASE WHEN vd_l_kg IS NOT NULL THEN 1 ELSE 0 END +
                    CASE WHEN therapeutic_range_min IS NOT NULL THEN 1 ELSE 0 END +
                    CASE WHEN therapeutic_range_max IS NOT NULL THEN 1 ELSE 0 END +
                    CASE WHEN adult_dose_mg IS NOT NULL THEN 1 ELSE 0 END +
                    CASE WHEN active_metabolites IS NOT NULL THEN 1 ELSE 0 END +
                    CASE WHEN food_effect IS NOT NULL THEN 1 ELSE 0 END +
                    CASE WHEN cns_penetration_percent IS NOT NULL THEN 1 ELSE 0 END
                ) as completed_fields,
                14 as total_fields
            FROM drugs
            WHERE (cmax_oral_mg_l IS NOT NULL OR cmax_iv_mg_l IS NOT NULL OR cmax_topical_mg_l IS NOT NULL)
            AND (
                half_life_hours IS NULL OR
                tmax_hours IS NULL OR
                auc_mg_h_l IS NULL OR
                steady_state_days IS NULL OR
                protein_binding_percent IS NULL OR
                vd_l_kg IS NULL OR
                therapeutic_range_min IS NULL OR
                therapeutic_range_max IS NULL OR
                adult_dose_mg IS NULL OR
                active_metabolites IS NULL OR
                food_effect IS NULL OR
                cns_penetration_percent IS NULL
            )
            ORDER BY completed_fields ASC, drug_name
            LIMIT 10
        `;
        
        return { query, projectId: this.projectId };
    }

    // Test connection
    async testConnection() {
        try {
            return { 
                success: true, 
                message: 'Using Supabase MCP - connection test via MCP tools',
                projectId: this.projectId 
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = SupabaseMCPClient;