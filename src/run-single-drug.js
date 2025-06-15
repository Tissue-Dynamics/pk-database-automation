const ClaudeDesktopBridge = require(process.env.HOME + '/.claude-tools/desktop-bridge/claude-desktop-bridge');

async function researchSingleDrug() {
    const bridge = new ClaudeDesktopBridge();
    
    console.log('🎯 PK Database Single Drug Research');
    console.log('===================================\n');
    
    // Based on your manual workflow, let's research a drug that needs more data
    // From your Supabase data, I'll pick a drug that likely has minimal data
    
    const drugToResearch = {
        drug_name: "Allopurinol",  // Common drug that likely needs more PK data
        missing_fields: [
            'Half-life',
            'Tmax', 
            'AUC',
            'Steady-state time',
            'Volume of distribution',
            'Protein binding',
            'CNS penetration',
            'Therapeutic range',
            'Active metabolites',
            'Food effects'
        ]
    };
    
    console.log(`🔍 Researching: ${drugToResearch.drug_name}`);
    console.log(`📋 Missing fields: ${drugToResearch.missing_fields.length}`);
    console.log(`   - ${drugToResearch.missing_fields.join('\n   - ')}\n`);
    
    const researchPrompt = `Research comprehensive pharmacokinetic data for ${drugToResearch.drug_name}:

REQUIRED DATA TO FIND:
${drugToResearch.missing_fields.map(field => `- ${field}`).join('\n')}

Please provide:
1. CMAX VALUES (with units):
   - Oral Cmax (mg/L) - if not already in database
   - Standard doses for oral route

2. TIMING PARAMETERS:
   - Half-life (hours) - both for allopurinol and its active metabolite oxypurinol
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
   - Also provide molecular weight for molar conversions

5. CLINICAL DATA:
   - Standard adult dose (mg)
   - Dosing frequency
   - Active metabolites (especially oxypurinol)
   - Food effects on absorption
   - DILI risk assessment

Search multiple authoritative sources (FDA labels, clinical pharmacology textbooks, peer-reviewed studies). Verify numbers from at least 2-3 sources. Present data in structured format similar to the Cisplatin example.

Focus on clinically validated values used in therapeutic drug monitoring and clinical practice.`;
    
    try {
        console.log('📡 Sending research request to Claude Desktop...');
        console.log('   (This will create a NEW chat to avoid interrupting your current work)\n');
        
        // Use triggerDeepResearchInNewChat to create a new chat
        await bridge.triggerDeepResearchInNewChat(
            `Pharmacokinetic data for ${drugToResearch.drug_name}`,
            [
                'Search multiple authoritative sources',
                'Verify numbers from 2-3 sources',
                'Include molecular weight for conversions',
                'Focus on clinically validated values',
                'Present in structured format like Cisplatin example'
            ]
        );
        
        console.log('✅ Research request sent successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Check the NEW chat in Claude Desktop for comprehensive PK data');
        console.log('2. Review and verify the research results');
        console.log('3. Extract the validated PK values');
        console.log('4. Update the database using the extracted data');
        console.log('\n💡 Example update command after extracting data:');
        console.log(`
// Once you have the data from Claude Desktop:
const updateData = {
    half_life_hours: XX,
    tmax_hours: XX,
    steady_state_days: XX,
    protein_binding_percent: XX,
    vd_l_kg: XX,
    therapeutic_range_min: XX,
    therapeutic_range_max: XX,
    molecular_weight: XXX.XX,
    active_metabolites: 'Oxypurinol (active)',
    food_effect: 'Better absorbed with food',
    cns_penetration_percent: XX,
    adult_dose_mg: XXX,
    // etc...
};
        `);
        
        return {
            success: true,
            drug: drugToResearch.drug_name,
            message: 'Research initiated in new Claude Desktop chat'
        };
        
    } catch (error) {
        console.error('❌ Research request failed:', error.message);
        console.log('\n💡 Troubleshooting:');
        console.log('- Ensure Claude Desktop is running');
        console.log('- Check Terminal has accessibility permissions');
        console.log('- Try running: ~/.claude-tools/desktop-bridge/claude-desktop-control research "test"');
        
        return {
            success: false,
            error: error.message
        };
    }
}

// Run the research
if (require.main === module) {
    researchSingleDrug().then(result => {
        if (result.success) {
            console.log('\n🎉 Process completed successfully!');
        } else {
            console.log('\n❌ Process failed.');
        }
        process.exit(result.success ? 0 : 1);
    });
}

module.exports = { researchSingleDrug };