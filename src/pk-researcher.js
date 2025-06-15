const ClaudeDesktopBridge = require(process.env.HOME + '/.claude-tools/desktop-bridge/claude-desktop-bridge');
const SupabaseClient = require('./supabase-client');

class PKResearcher {
    constructor() {
        this.bridge = new ClaudeDesktopBridge();
        this.supabase = new SupabaseClient();
    }

    // Generate comprehensive research prompt for a drug
    generateResearchPrompt(drug) {
        const missingFields = this.identifyMissingFields(drug);
        
        return `Research comprehensive pharmacokinetic data for ${drug.drug_name}:

REQUIRED DATA TO FIND:
${missingFields.map(field => `- ${field}`).join('\n')}

Please provide:
1. CMAX VALUES (with units):
   - Oral Cmax (mg/L)
   - IV Cmax (mg/L) 
   - Topical Cmax (mg/L) if applicable
   - Standard doses for each route

2. TIMING PARAMETERS:
   - Half-life (hours)
   - Tmax (hours)
   - Time to steady state (days)
   - AUC values (mg·h/L)

3. DISTRIBUTION:
   - Volume of distribution (L/kg)
   - Protein binding (%)
   - CNS penetration (CSF/plasma ratio %)

4. THERAPEUTIC RANGE:
   - Minimum therapeutic level (mg/L)
   - Maximum therapeutic level (mg/L)
   - Convert to molar units (M)

5. CLINICAL DATA:
   - Standard adult dose (mg)
   - Dosing frequency
   - Active metabolites
   - Food effects
   - DILI risk assessment

Search multiple authoritative sources (FDA labels, clinical pharmacology textbooks, peer-reviewed studies). Verify numbers from at least 2-3 sources. Present data in structured format with molecular weight for molar conversions.

Focus on clinically validated values used in therapeutic drug monitoring and clinical practice.`;
    }

    // Identify which fields are missing for a drug
    identifyMissingFields(drug) {
        const fields = [];
        
        if (!drug.cmax_oral_mg_l) fields.push('Oral Cmax');
        if (!drug.cmax_iv_mg_l) fields.push('IV Cmax');
        if (!drug.half_life_hours) fields.push('Half-life');
        if (!drug.tmax_hours) fields.push('Tmax');
        if (!drug.auc_mg_h_l) fields.push('AUC');
        if (!drug.steady_state_days) fields.push('Steady-state time');
        if (!drug.protein_binding_percent) fields.push('Protein binding');
        if (!drug.vd_l_kg) fields.push('Volume of distribution');
        if (!drug.therapeutic_range_min) fields.push('Therapeutic range minimum');
        if (!drug.therapeutic_range_max) fields.push('Therapeutic range maximum');
        if (!drug.adult_dose_mg) fields.push('Standard adult dose');
        if (!drug.active_metabolites) fields.push('Active metabolites');
        if (!drug.food_effect) fields.push('Food effects');
        if (!drug.cns_penetration_percent) fields.push('CNS penetration');
        
        return fields;
    }

    // Calculate completion score for a drug (0-100)
    calculateCompletionScore(drug) {
        const totalFields = 14; // Total important PK fields
        const completedFields = [
            drug.cmax_oral_mg_l,
            drug.cmax_iv_mg_l,
            drug.half_life_hours,
            drug.tmax_hours,
            drug.auc_mg_h_l,
            drug.steady_state_days,
            drug.protein_binding_percent,
            drug.vd_l_kg,
            drug.therapeutic_range_min,
            drug.therapeutic_range_max,
            drug.adult_dose_mg,
            drug.active_metabolites,
            drug.food_effect,
            drug.cns_penetration_percent
        ].filter(field => field !== null && field !== undefined).length;
        
        return Math.round((completedFields / totalFields) * 100);
    }

    // Convert mg/L to molar (M) using molecular weight
    convertToMolar(mgPerL, molecularWeight) {
        if (!mgPerL || !molecularWeight) return null;
        // mg/L to M: (mg/L) / (molecular weight in g/mol) / 1000
        return (mgPerL / molecularWeight) / 1000;
    }

    // Find the drug with the lowest completion score that has some data
    async findDrugToImprove() {
        const drugs = await this.supabase.getAllDrugs();
        
        // Calculate completion scores and filter for drugs with some existing data
        const drugsWithScores = drugs
            .map(drug => ({
                ...drug,
                completionScore: this.calculateCompletionScore(drug),
                missingFieldCount: this.identifyMissingFields(drug).length
            }))
            .filter(drug => drug.completionScore > 0 && drug.completionScore < 80) // Has some data but incomplete
            .sort((a, b) => {
                // Sort by completion score (ascending), then by missing field count (descending for more potential)
                if (a.completionScore !== b.completionScore) {
                    return a.completionScore - b.completionScore;
                }
                return b.missingFieldCount - a.missingFieldCount;
            });

        return drugsWithScores[0] || null;
    }

    // Research a specific drug using Claude Desktop
    async researchDrug(drug) {
        console.log(`🔍 Researching ${drug.drug_name}...`);
        console.log(`Current completion: ${this.calculateCompletionScore(drug)}%`);
        console.log(`Missing fields: ${this.identifyMissingFields(drug).length}`);
        
        const prompt = this.generateResearchPrompt(drug);
        
        try {
            // Send research request to Claude Desktop in a new chat
            await this.bridge.triggerDeepResearchInNewChat(
                `Pharmacokinetic data for ${drug.drug_name}`,
                [
                    'Search multiple authoritative sources',
                    'Verify numbers from 2-3 sources', 
                    'Include molecular weight for conversions',
                    'Focus on clinically validated values',
                    'Present in structured format'
                ]
            );
            
            console.log(`✅ Research request sent to Claude Desktop for ${drug.drug_name}`);
            console.log(`📋 Please review the research results and provide the data for database update.`);
            
            return {
                success: true,
                drug: drug,
                message: `Research initiated for ${drug.drug_name}. Check Claude Desktop for comprehensive PK data.`
            };
            
        } catch (error) {
            console.error(`❌ Research failed for ${drug.drug_name}:`, error.message);
            return {
                success: false,
                drug: drug,
                error: error.message
            };
        }
    }

    // Update drug with new PK data
    async updateDrugData(drugId, pkData) {
        try {
            // Convert therapeutic ranges to molar if molecular weight provided
            if (pkData.molecularWeight) {
                if (pkData.therapeutic_range_min) {
                    pkData.therapeutic_range_min_m = this.convertToMolar(
                        pkData.therapeutic_range_min, 
                        pkData.molecularWeight
                    );
                }
                if (pkData.therapeutic_range_max) {
                    pkData.therapeutic_range_max_m = this.convertToMolar(
                        pkData.therapeutic_range_max, 
                        pkData.molecularWeight
                    );
                }
            }

            const updatedDrug = await this.supabase.updateDrug(drugId, pkData);
            
            console.log(`✅ Updated ${updatedDrug.drug_name} with new PK data`);
            console.log(`New completion score: ${this.calculateCompletionScore(updatedDrug)}%`);
            
            return updatedDrug;
            
        } catch (error) {
            console.error(`❌ Database update failed:`, error.message);
            throw error;
        }
    }

    // Main automation function
    async improveDatabase() {
        console.log('🚀 Starting PK database improvement process...\n');
        
        try {
            // Get current statistics
            const stats = await this.supabase.getCompletionStats();
            console.log('📊 Current Database Status:');
            console.log(`- Total drugs: ${stats.total}`);
            console.log(`- With any Cmax: ${stats.withAnyCmax} (${(stats.withAnyCmax/stats.total*100).toFixed(1)}%)`);
            console.log(`- With complete PK profiles: ${stats.withCompletePkProfile} (${(stats.withCompletePkProfile/stats.total*100).toFixed(1)}%)`);
            console.log(`- With therapeutic ranges: ${stats.withTherapeuticRange} (${(stats.withTherapeuticRange/stats.total*100).toFixed(1)}%)\n`);
            
            // Find drug to improve
            const drugToResearch = await this.findDrugToImprove();
            
            if (!drugToResearch) {
                console.log('🎉 No drugs found that need improvement! Database appears complete.');
                return null;
            }
            
            // Research the selected drug
            const result = await this.researchDrug(drugToResearch);
            
            return result;
            
        } catch (error) {
            console.error('❌ Database improvement process failed:', error.message);
            throw error;
        }
    }
}

module.exports = PKResearcher;