# OA Assignment Monitor - ALDI Distribution Management

## Overview
SAP Cloud Application Programming (CAP) model dashboard for monitoring Order Area (OA) assignments in ALDI's distribution management system.

## Application Structure

### Data Model (db/schema.cds)
- **MaterialMaster**: 300 retail products with descriptions
- **MaterialOAMapping**: Material to Order Area assignments with OA descriptions
- **OARules**: Order Area rules and configurations
- **Dashboard Views**: DashboardMetrics, OrderAreaSummary, DistributionCentreSummary

### Order Area Categories (Standardized IDs)
- **190**: Ambient (Dry goods, shelf-stable)
- **191**: Freezer (Frozen goods, -18°C)
- **192**: Chiller (Refrigerated, 2-6°C)
- **193**: Fresh Meat (Meat & poultry, 0-4°C)
- **194**: Produce (Fruit & vegetables, 8-12°C)
- **195**: Bakery (Bread & pastries)

### OData Service
- **Endpoint**: http://localhost:4004/odata/v4/oaassignment
- **Entities**: MaterialMaster, MaterialOAMapping, OARules
- **Analytics**: DashboardMetrics, OrderAreaSummary, DistributionCentreSummary

### Dashboard UI
- **Location**: [app/dashboard/webapp/](app/dashboard/webapp/)
- **Access**: http://localhost:4004/dashboard/webapp/
- **Features**:
  - Hero section with automation rate (92.67%)
  - Today's run summary with 3 KPI cards
  - Order Area breakdown by category (6 cards)
  - Real-time data from OData services

## Data Summary
- **Total Products**: 300
- **Assigned**: 278 (92.67%)
- **Unassigned**: 22 (7.33%)
- **Distribution**:
  - Ambient: 48 products (93.75% assigned)
  - Freezer: 53 products (90.57% assigned)
  - Chiller: 50 products (92.00% assigned)
  - Fresh Meat: 53 products (96.23% assigned)
  - Produce: 47 products (89.36% assigned)
  - Bakery: 49 products (93.88% assigned)

## Running the Application

### Development
```bash
cd "/Users/I309531/AI POC/ALDI_OA_ASSIGNMENT"
cds watch
```
Access:
- Dashboard: http://localhost:4004/dashboard/webapp/
- OData Service: http://localhost:4004/odata/v4/oaassignment
- API Explorer: http://localhost:4004

### Generate Sample Data
```bash
node generate-data.js
```

### Production Build
```bash
npm run build
```

## SAP BTP Deployment

### Prerequisites
1. SAP BTP Cloud Foundry environment
2. HANA Cloud service instance
3. CF CLI installed

### Deployment Steps

1. **Add HANA configuration** to package.json:
```json
"cds": {
  "requires": {
    "db": {
      "kind": "hana-cloud"
    }
  }
}
```

2. **Build for production**:
```bash
cds build --production
```

3. **Create manifest.yml** for CF deployment:
```yaml
applications:
- name: aldi-oa-assignment
  path: gen/srv
  buildpacks:
  - nodejs_buildpack
  memory: 256M
  services:
  - aldi-oa-hana
```

4. **Deploy to BTP**:
```bash
cf login
cf push
```

## Project Files

### Data Files
- [db/data/aldi.oa-MaterialMaster.csv](db/data/aldi.oa-MaterialMaster.csv) (300 records)
- [db/data/aldi.oa-MaterialOAMapping.csv](db/data/aldi.oa-MaterialOAMapping.csv) (300 records)
- [db/data/aldi.oa-OARules.csv](db/data/aldi.oa-OARules.csv) (200 records)

### Core Application Files
- [db/schema.cds](db/schema.cds) - Data model and view definitions
- [srv/oa-service.cds](srv/oa-service.cds) - OData V4 service
- [app/dashboard/webapp/](app/dashboard/webapp/) - SAPUI5 dashboard

### Configuration
- [package.json](package.json) - Dependencies and scripts
- [generate-data.js](generate-data.js) - Sample data generator

## Technology Stack
- **Backend**: SAP Cloud Application Programming (CAP) Model v10
- **Runtime**: Node.js with ES modules
- **Database**: SQLite (dev), SAP HANA Cloud (prod)
- **Frontend**: SAPUI5 1.120.0 with Horizon theme
- **OData**: V4
- **Deployment Target**: SAP Business Technology Platform (BTP)

## Key Features
- Real-time automation rate monitoring
- Product assignment status tracking
- Distribution by order area categories
- Comprehensive product catalog with meaningful descriptions
- REST/OData V4 API for integration
- Responsive dashboard UI
- Ready for SAP BTP deployment
