const PKResearcher = require('./pk-researcher');
require('dotenv').config();

// Interactive script to update a drug with new PK data
async function updateDrugInteractive() {
    const researcher = new PKResearcher();
    
    console.log('🔄 Drug Data Update Utility');
    console.log('===========================\n');
    
    try {
        // Get command line arguments
        const args = process.argv.slice(2);
        
        if (args.length === 0) {
            console.log('Usage examples:');
            console.log('node src/update-drug.js <drug-name-or-id>');
            console.log('node src/update-drug.js "metformin"');
            console.log('node src/update-drug.js 123');
            process.exit(1);
        }
        
        const drugIdentifier = args[0];
        
        // Find the drug
        let drug;
        if (isNaN(drugIdentifier)) {
            // Search by name
            drug = await researcher.supabase.getDrugByName(drugIdentifier);
            if (!drug) {
                console.error(`❌ Drug "${drugIdentifier}" not found`);
                process.exit(1);
            }
        } else {
            // Search by ID
            const allDrugs = await researcher.supabase.getAllDrugs();
            drug = allDrugs.find(d => d.id === parseInt(drugIdentifier));
            if (!drug) {
                console.error(`❌ Drug with ID ${drugIdentifier} not found`);
                process.exit(1);
            }
        }
        
        console.log(`📋 Found: ${drug.drug_name} (ID: ${drug.id})`);
        console.log(`Current completion: ${researcher.calculateCompletionScore(drug)}%`);
        
        const missingFields = researcher.identifyMissingFields(drug);
        console.log(`Missing fields: ${missingFields.join(', ')}\n`);
        
        // Show current data
        console.log('📊 Current PK Data:');
        console.log(`- Cmax (oral): ${drug.cmax_oral_mg_l || 'N/A'} mg/L`);
        console.log(`- Cmax (IV): ${drug.cmax_iv_mg_l || 'N/A'} mg/L`);
        console.log(`- Half-life: ${drug.half_life_hours || 'N/A'} hours`);
        console.log(`- Tmax: ${drug.tmax_hours || 'N/A'} hours`);
        console.log(`- Protein binding: ${drug.protein_binding_percent || 'N/A'}%`);
        console.log(`- Therapeutic range: ${drug.therapeutic_range_min || 'N/A'} - ${drug.therapeutic_range_max || 'N/A'} mg/L`);
        console.log();
        
        // Start research for this specific drug
        console.log('🔍 Initiating research for additional PK data...');
        await researcher.researchDrug(drug);
        
        console.log('\n✅ Research request sent to Claude Desktop!');
        console.log('📋 Please review the research results and manually extract the PK values.');
        console.log('\n💡 To update with extracted data, you can use the Supabase client directly:');
        console.log(`
Example update:
const researcher = new PKResearcher();
await researcher.updateDrugData(${drug.id}, {
    half_life_hours: 25.9,
    tmax_hours: 0,
    steady_state_days: 5.4,
    protein_binding_percent: 90,
    therapeutic_range_min: 1.0,
    therapeutic_range_max: 5.0,
    therapeutic_range_min_m: 3.333e-6,
    therapeutic_range_max_m: 1.666e-5,
    vd_l_kg: 0.284,
    adult_dose_mg: 75,
    active_metabolites: 'None - non-enzymatic aquation',
    food_effect: 'N/A - IV only',
    cns_penetration_percent: 3.6,
    molecularWeight: 300.05
});
        `);
        
    } catch (error) {
        console.error('❌ Update process failed:', error.message);
        process.exit(1);
    }
}

// Example function to update with specific data (template)
async function updateWithData(drugId, pkData) {
    const researcher = new PKResearcher();
    
    try {
        const updatedDrug = await researcher.updateDrugData(drugId, pkData);
        console.log('✅ Drug updated successfully:', updatedDrug.drug_name);
        return updatedDrug;
    } catch (error) {
        console.error('❌ Update failed:', error.message);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    updateDrugInteractive();
}

module.exports = { updateDrugInteractive, updateWithData };