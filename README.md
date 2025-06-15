# PK Database Automation

Automated pharmacokinetic database population system using Claude Desktop Bridge for intelligent research and data extraction.

## 🎯 Project Goals

Build a comprehensive pharmacokinetic database for all 194 drugs by automating the research and population of:
- **Cmax values** (oral/IV/topical routes)
- **Half-life data** 
- **Timing parameters** (Tmax, AUC, steady-state)
- **Therapeutic ranges**
- **Clinical pharmacology data**

## 📊 Current Status

- **184/194 drugs** with Cmax data (94.8%)
- **106 drugs** with comprehensive PK profiles
- **48 drugs** with complete timing/exposure data
- **Target**: 100% completion with automated research

## 🛠️ Architecture

### Core Components
- **Claude Desktop Bridge**: Intelligent research automation
- **Supabase Client**: Database operations
- **Drug Processor**: Data validation and formatting
- **Batch System**: Systematic processing of remaining drugs

### Key Features
- Automated research queries for missing PK data
- Data validation and quality checks
- Batch processing with rate limiting
- Progress tracking and reporting
- Error handling and retry logic

## 🚀 Setup

1. **Environment Configuration**:
   ```bash
   cp .env.example .env
   # Add your Supabase credentials
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Test Connection**:
   ```bash
   npm run test
   ```

## 📋 Usage

### Research Individual Drugs
```bash
# Research specific drug data
node .claude/research.js "Cmax and half-life for metformin"

# Debug specific issues
node .claude/debug.js "Missing therapeutic range data"
```

### Batch Processing
```bash
# Process all drugs missing Cmax data
npm run process-drugs

# Start main automation
npm start
```

## 🔄 Automation Workflow

1. **Identify Missing Data**: Query database for incomplete records
2. **Generate Research Queries**: Create specific prompts for Claude Desktop
3. **Extract Data**: Parse research results and validate
4. **Update Database**: Store new data with quality checks
5. **Progress Tracking**: Monitor completion status
6. **Error Handling**: Retry failed queries with different approaches

## 📈 Progress Tracking

The system continuously monitors:
- Completion percentages by data type
- Research success rates
- Data quality metrics
- Batch processing status

## 🔧 Development

### Scripts
- `npm start` - Run main automation
- `npm run process-drugs` - Batch process specific drugs
- `npm run test` - Test database connection
- `npm run research` - Manual research queries

### Git Workflow
- Feature branches for new capabilities
- Automated commits during processing
- Progress snapshots and milestone tracking

## 📊 Database Schema

Working with comprehensive PK data structure:
- **5 Cmax columns** (oral/IV/topical + dose + notes)
- **8 timing/exposure columns** (Tmax, AUC, steady-state, accumulation)
- **20+ clinical fields** (metabolites, food effects, CNS penetration)
- **Structured dose columns** (adult/pediatric dosing)

## 🎯 Next Milestones

- [ ] Complete final 10 drugs missing Cmax data
- [ ] Expand timing data to 100+ drugs
- [ ] Add therapeutic ranges for 75+ drugs
- [ ] Complete dose standardization for all drugs
- [ ] Implement advanced validation rules