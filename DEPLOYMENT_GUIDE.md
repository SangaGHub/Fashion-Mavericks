# OA Assignment Monitor - Deployment Guide

## Overview
This project contains an SAP CAP application with OData V4 services and a SAP Fiori Elements Analytical List Page for monitoring Order Area assignments.

## Applications

### 1. SAP Fiori Elements - Analytical List Page (Detail View)
**URL**: http://localhost:8080/test/flp.html#app-preview

**Features**:
- Filter bar with 5 fields (Assignment Status, Order Area ID, Order Area Description, Distribution Centre, Article Type)
- Data table showing all 300 products
- Columns: Material Number, Product Description, Order Area ID, Order Area, Status, Distribution Centre, Article Type
- Export to Excel functionality
- Sorting and filtering capabilities
- Standard SAP Fiori UI styling

**Status**: ✅ **Working** - Table view functional with all data displayed

**Location**: `/oa-analytics/`

### 2. CAP Backend Service
**URL**: http://localhost:4004

**OData V4 Endpoints**:
- `/odata/v4/oaassignment/MaterialOAMapping` - 300 product-to-OA mappings
- `/odata/v4/oaassignment/MaterialMaster` - 300 material master records
- `/odata/v4/oaassignment/OARules` - 200 OA assignment rules
- `/odata/v4/oaassignment/DashboardMetrics` - Aggregated metrics
- `/odata/v4/oaassignment/OrderAreaSummary` - Summary by order area
- `/odata/v4/oaassignment/DistributionCentreSummary` - Summary by DC

**Status**: ✅ **Working** - All endpoints returning data correctly

## Project Structure

```
ALDI_OA_ASSIGNMENT/
├── db/
│   ├── schema.cds              # CDS data model with UI annotations
│   └── data/                   # CSV test data (300 products)
├── srv/
│   └── oa-service.cds          # OData service definition
├── oa-analytics/               # Fiori Elements ALP application
│   └── webapp/
│       ├── manifest.json       # App descriptor
│       └── index.html
└── app/
    └── dashboard/              # Custom SAPUI5 dashboard (in progress)
        └── webapp/
```

## Data Model

### Entities
1. **MaterialMaster** - Material master data (300 records)
2. **MaterialOAMapping** - Material to Order Area assignments (300 records)
3. **OARules** - Order Area assignment rules (200 records)

### Analytical Views
1. **DashboardMetrics** - Overall automation rate and totals
2. **OrderAreaSummary** - Metrics by order area (6 areas)
3. **DistributionCentreSummary** - Metrics by distribution centre

## Running the Application

### Start CAP Server
```bash
cd "/Users/I309531/AI POC/ALDI_OA_ASSIGNMENT"
cds watch
```
Server starts on: http://localhost:4004

### Start Fiori Elements App
```bash
cd "/Users/I309531/AI POC/ALDI_OA_ASSIGNMENT/oa-analytics"
npm start
```
App runs on: http://localhost:8080

## Technical Details

### CAP Configuration
- **CDS Version**: @sap/cds v10
- **Database**: SQLite (in-memory for development)
- **OData Version**: V4
- **Node.js**: ES modules

### Fiori Elements Configuration
- **Template**: Analytical List Page (FE_ALP)
- **UI5 Version**: 1.154.0
- **Main Entity**: MaterialOAMapping
- **Service Path**: /odata/v4/oaassignment/

### UI Annotations Applied
- @UI.LineItem - Table column definitions
- @UI.SelectionFields - Filter bar fields
- @UI.PresentationVariant - Default visualization settings
- @UI.SelectionVariant - Default filter values
- @UI.Chart - Chart configuration (in progress)
- @Aggregation.ApplySupported - Analytics capabilities

## Data Summary
- **Total Products**: 300
- **Assigned Products**: 278 (93%)
- **Unassigned Products**: 22 (7%)
- **Order Areas**: 6 (Ambient, Freezer, Chiller, Fresh Meat, Produce, Bakery)
- **Distribution Centres**: Multiple (DC10, WH02, DC20, BD01, etc.)
- **Article Types**: Z400, HALB, Z200, Z300

## Next Steps for Production

1. **Database Migration**
   - Switch from SQLite to SAP HANA Cloud
   - Update package.json dependencies

2. **Authentication**
   - Configure XSUAA service
   - Add role-based access control

3. **Deployment**
   - Deploy to SAP BTP Cloud Foundry
   - Configure destinations and connectivity

4. **Analytics Enhancement**
   - Complete chart aggregation configuration
   - Add more visualizations to ALP

5. **Testing**
   - Add unit tests for CAP services
   - Add integration tests for OData endpoints
   - Add UI tests for Fiori application

## Known Issues

1. **Fiori Elements Chart** - Chart area shows "No Entries" placeholder
   - **Cause**: Complex aggregation configuration needed for ALP charts
   - **Workaround**: Table view is fully functional with all data
   - **Status**: Under investigation

2. **Custom Dashboard** - Custom SAPUI5 dashboard has view rendering issues
   - **Cause**: Invalid properties in XML view
   - **Status**: Requires view cleanup and testing

## Support URLs
- CAP Home: http://localhost:4004
- Fiori Elements: http://localhost:8080/test/flp.html#app-preview
- OData Metadata: http://localhost:4004/odata/v4/oaassignment/$metadata
