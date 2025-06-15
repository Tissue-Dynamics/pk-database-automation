const SupabaseClient = require('./supabase-client');
require('dotenv').config();

async function testConnection() {
    console.log('🧪 Testing PK Database Connection');
    console.log('=================================\n');
    
    const supabase = new SupabaseClient();
    
    try {
        // Test basic connection
        console.log('1. Testing database connection...');
        const connectionTest = await supabase.testConnection();
        
        if (!connectionTest.success) {
            console.error('❌ Connection failed:', connectionTest.error);
            return false;
        }
        
        console.log('✅ Database connection successful\n');
        
        // Test data retrieval
        console.log('2. Testing data retrieval...');
        const stats = await supabase.getCompletionStats();
        
        if (!stats) {
            console.error('❌ Failed to retrieve completion statistics');
            return false;
        }
        
        console.log('✅ Data retrieval successful');
        console.log('📊 Database Statistics:');
        console.log(`   - Total drugs: ${stats.total}`);
        console.log(`   - With any Cmax: ${stats.withAnyCmax} (${(stats.withAnyCmax/stats.total*100).toFixed(1)}%)`);
        console.log(`   - With complete PK profiles: ${stats.withCompletePkProfile} (${(stats.withCompletePkProfile/stats.total*100).toFixed(1)}%)`);
        console.log(`   - With therapeutic ranges: ${stats.withTherapeuticRange} (${(stats.withTherapeuticRange/stats.total*100).toFixed(1)}%)\n`);
        
        // Test finding drugs that need improvement
        console.log('3. Testing drug improvement identification...');
        const drugsMissingCmax = await supabase.getDrugsMissingCmax();
        console.log(`✅ Found ${drugsMissingCmax.length} drugs missing Cmax data`);
        
        const drugsMissingRanges = await supabase.getDrugsMissingData('therapeutic_range_min');
        console.log(`✅ Found ${drugsMissingRanges.length} drugs missing therapeutic ranges\n`);
        
        // Test Claude Desktop Bridge
        console.log('4. Testing Claude Desktop Bridge...');
        const ClaudeDesktopBridge = require(process.env.HOME + '/.claude-tools/desktop-bridge/claude-desktop-bridge');
        const bridge = new ClaudeDesktopBridge();
        
        const isClaudeRunning = await bridge.isClaudeRunning();
        console.log(`✅ Claude Desktop status: ${isClaudeRunning ? 'Running' : 'Not running'}`);
        
        if (!isClaudeRunning) {
            console.log('💡 Claude Desktop will be launched automatically when needed');
        }
        
        console.log('\n🎉 All tests passed! System ready for automated PK research.');
        
        return true;
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n💡 Common issues:');
        console.log('   - Check .env file with correct Supabase credentials');
        console.log('   - Ensure Supabase project is accessible');
        console.log('   - Verify Claude Desktop Bridge installation');
        
        return false;
    }
}

// Run if called directly
if (require.main === module) {
    testConnection().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { testConnection };