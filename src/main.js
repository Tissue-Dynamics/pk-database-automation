const PKResearcher = require('./pk-researcher');
require('dotenv').config();

async function main() {
    console.log('🎯 PK Database Automation System');
    console.log('================================\n');
    
    const researcher = new PKResearcher();
    
    try {
        // Test database connection
        console.log('🔌 Testing database connection...');
        const connectionTest = await researcher.supabase.testConnection();
        
        if (!connectionTest.success) {
            console.error('❌ Database connection failed:', connectionTest.error);
            console.log('\n💡 Please check your .env file with Supabase credentials');
            process.exit(1);
        }
        
        console.log('✅ Database connected successfully\n');
        
        // Start the improvement process
        const result = await researcher.improveDatabase();
        
        if (result && result.success) {
            console.log('\n🎉 Research process completed successfully!');
            console.log('📋 Next steps:');
            console.log('1. Review the research results in Claude Desktop');
            console.log('2. Extract the PK data values');
            console.log('3. Run the update script with the new data');
            console.log('\n💡 Once you have the data, you can update the database using:');
            console.log(`   node src/update-drug.js ${result.drug.id} <pk-data>`);
        }
        
    } catch (error) {
        console.error('❌ System error:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { main };