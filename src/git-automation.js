const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class GitAutomation {
    constructor() {
        this.projectPath = process.cwd();
    }

    // Commit progress with automated message
    async commitProgress(type, message, details = {}) {
        try {
            const timestamp = new Date().toISOString().split('T')[0];
            
            let commitMessage;
            
            switch (type) {
                case 'data':
                    commitMessage = `data: ${message}

${details.drugNames ? `- Updated: ${details.drugNames.join(', ')}` : ''}
${details.successRate ? `- Success rate: ${details.successRate}%` : ''}
${details.remainingCount ? `- Remaining: ${details.remainingCount} drugs` : ''}
${details.completionStats ? `- Database completion: ${details.completionStats}` : ''}

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>`;
                    break;
                    
                case 'feature':
                    commitMessage = `feat: ${message}

${details.description ? details.description : ''}

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>`;
                    break;
                    
                case 'progress':
                    commitMessage = `progress: ${message} - ${timestamp}

${details.stats ? Object.entries(details.stats).map(([key, value]) => `- ${key}: ${value}`).join('\n') : ''}

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>`;
                    break;
                    
                default:
                    commitMessage = `${type}: ${message}

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>`;
            }
            
            // Add all changes
            await execAsync('git add .');
            
            // Check if there are changes to commit
            const { stdout: status } = await execAsync('git status --porcelain');
            
            if (!status.trim()) {
                console.log('📝 No changes to commit');
                return { success: true, message: 'No changes to commit' };
            }
            
            // Commit with the generated message
            await execAsync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`);
            
            console.log('✅ Changes committed successfully');
            
            // Push to remote
            try {
                await execAsync('git push');
                console.log('📤 Changes pushed to remote');
                return { success: true, message: 'Committed and pushed successfully' };
            } catch (pushError) {
                console.log('⚠️  Committed locally but failed to push:', pushError.message);
                return { success: true, message: 'Committed locally, push failed' };
            }
            
        } catch (error) {
            console.error('❌ Git operation failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Commit after drug data update
    async commitDrugUpdate(drugName, fieldsUpdated, completionScore) {
        return this.commitProgress('data', `Updated ${drugName} with comprehensive PK data`, {
            drugNames: [drugName],
            successRate: 100,
            completionStats: `${completionScore}% complete`,
            description: `Added ${fieldsUpdated.length} PK parameters: ${fieldsUpdated.join(', ')}`
        });
    }

    // Commit daily progress
    async commitDailyProgress(stats) {
        return this.commitProgress('progress', 'Daily database status update', {
            stats: {
                'Total drugs': stats.total,
                'Cmax coverage': `${stats.withAnyCmax}/${stats.total} (${(stats.withAnyCmax/stats.total*100).toFixed(1)}%)`,
                'Complete PK profiles': `${stats.withCompletePkProfile}/${stats.total} (${(stats.withCompletePkProfile/stats.total*100).toFixed(1)}%)`,
                'Therapeutic ranges': `${stats.withTherapeuticRange}/${stats.total} (${(stats.withTherapeuticRange/stats.total*100).toFixed(1)}%)`
            }
        });
    }

    // Commit feature development
    async commitFeature(featureName, description) {
        return this.commitProgress('feature', featureName, {
            description: description
        });
    }

    // Create milestone tag
    async createMilestone(tagName, message) {
        try {
            await execAsync(`git tag -a ${tagName} -m "${message}"`);
            await execAsync(`git push origin ${tagName}`);
            
            console.log(`✅ Created milestone tag: ${tagName}`);
            return { success: true, tag: tagName };
            
        } catch (error) {
            console.error('❌ Failed to create milestone:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Check if milestone should be created
    async checkMilestones(stats) {
        const milestones = [];
        
        const cmaxPercentage = (stats.withAnyCmax / stats.total * 100);
        const profilePercentage = (stats.withCompletePkProfile / stats.total * 100);
        
        // Check various milestone thresholds
        if (cmaxPercentage >= 95 && cmaxPercentage < 96) {
            milestones.push({
                tag: 'v0.95-cmax-milestone',
                message: `95% Cmax coverage achieved (${stats.withAnyCmax}/${stats.total} drugs)`
            });
        }
        
        if (cmaxPercentage >= 98 && cmaxPercentage < 99) {
            milestones.push({
                tag: 'v0.98-cmax-milestone', 
                message: `98% Cmax coverage achieved (${stats.withAnyCmax}/${stats.total} drugs)`
            });
        }
        
        if (cmaxPercentage >= 100) {
            milestones.push({
                tag: 'v1.0-cmax-complete',
                message: `100% Cmax coverage achieved! All ${stats.total} drugs have Cmax data`
            });
        }
        
        if (stats.withCompletePkProfile >= 100 && stats.withCompletePkProfile < 105) {
            milestones.push({
                tag: 'v1.0-hundred-profiles',
                message: `100+ drugs with complete PK profiles (${stats.withCompletePkProfile} drugs)`
            });
        }
        
        if (stats.withTherapeuticRange >= 75 && stats.withTherapeuticRange < 80) {
            milestones.push({
                tag: 'v1.0-therapeutic-ranges',
                message: `75+ drugs with therapeutic ranges (${stats.withTherapeuticRange} drugs)`
            });
        }
        
        return milestones;
    }
}

module.exports = GitAutomation;