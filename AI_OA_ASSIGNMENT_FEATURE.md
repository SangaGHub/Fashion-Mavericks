# AI-Powered Order Area Assignment Feature

## Overview
This feature uses SAP AI Core with GPT-4o to automatically suggest Order Area assignments for unassigned products based on historical assignment patterns.

## Architecture

### Components

1. **Historical Training Data**
   - File: `app/dashboard/webapp/historical_oa_assignments.csv`
   - Contains 278 assigned products with attributes:
     - Material Number
     - Product Description
     - Distribution Centre
     - Article Type
     - Order Area ID
     - Order Area Description
   - Serves as context for LLM predictions

2. **AI Service Module**
   - File: `app/dashboard/webapp/service/AIService.js`
   - Handles SAP AI Core integration
   - Key functions:
     - `_getToken()`: OAuth2 authentication with SAP AI Core
     - `loadHistoricalData()`: Loads and parses historical CSV
     - `predictOrderArea(product)`: Main prediction function
     - `validatePrediction(prediction)`: Validates AI response format

3. **UI Integration**
   - File: `app/dashboard/webapp/view/ProductList.view.xml`
   - "Suggest OA via AI" button (visible only on unassigned products page)
   - Table selection mode enabled for unassigned products

4. **Controller Logic**
   - File: `app/dashboard/webapp/controller/ProductList.controller.js`
   - `onAISuggest()`: Triggers AI prediction workflow
   - `_showAutoAssignDialog()`: High confidence (≥80%) dialog
   - `_showApprovalDialog()`: Low confidence (<80%) dialog
   - `_assignOrderArea()`: Updates product with AI suggestion

## Workflow

### User Interaction Flow

1. **Navigation**
   - User clicks "Products Not Assigned to OA" tile on dashboard
   - Navigates to unassigned products list (22 products)

2. **Selection**
   - User selects one unassigned product from table
   - "Suggest OA via AI" button becomes enabled

3. **AI Prediction**
   - User clicks "Suggest OA via AI"
   - Busy dialog shows "Analyzing product and predicting Order Area..."
   - System calls SAP AI Core GPT-4o model

4. **AI Processing**
   - Loads 278 historical assignments as context
   - Sends product attributes to LLM:
     - Material Number
     - Product Description
     - Distribution Centre
     - Article Type
   - LLM analyzes patterns and returns JSON response

5. **Confidence-Based Routing**

   **High Confidence (≥80%)**
   - Shows confirmation dialog with:
     - Suggested OA ID and description
     - Confidence score
     - AI reasoning
     - 3 matched historical products
     - Alternative suggestion (if applicable)
   - User clicks OK → Auto-assigns to OA
   - Product moves from unassigned to assigned list

   **Low Confidence (<80%)**
   - Shows warning dialog requiring human approval
   - Same information as high confidence
   - User must explicitly approve (Yes/No)
   - If approved → Assigns to OA
   - If rejected → No action taken

6. **Assignment**
   - Updates product record with:
     - ORDER_AREA_ID
     - OA_DESCRIPTION
     - ASSIGNMENT_STATUS = "ASSIGNED"
     - AI_ASSIGNED = true
     - AI_CONFIDENCE = score
     - AI_MODEL = "gpt-4o"
     - AI_TIMESTAMP = ISO timestamp
   - Refreshes product list
   - Updates count displays

## SAP AI Core Configuration

### Authentication
- **Client ID**: `<AICORE_CLIENT_ID>`
- **Auth URL**: `https://genai-4063.authentication.eu12.hana.ondemand.com/oauth/token`
- **Grant Type**: client_credentials

### Model Settings
- **Model**: gpt-4o (via SAP AI Core)
- **API Endpoint**: `https://api.ai.intprod-eu12.eu-central-1.aws.ml.hana.ondemand.com/v2/inference/deployments/d22e1c74c90ef2f8/chat/completions`
- **Temperature**: 0.2 (low for consistent, deterministic results)
- **Max Tokens**: 1000
- **Response Format**: json_object

## LLM Prompt Structure

### System Prompt
Defines the AI's role as an Order Area assignment expert with:
- Available OA definitions (190-195)
- Assignment rules and criteria
- Required output format (strict JSON schema)

### User Prompt
Contains:
- Top 20 relevant historical assignments
- Target product attributes
- Request for prediction in specified format

### Expected JSON Response
```json
{
  "suggestedOrderAreaId": 194,
  "suggestedOrderAreaDescription": "Produce",
  "confidenceScore": 85,
  "reasoning": "Product description indicates organic pasta...",
  "matchedHistoricalProducts": [
    {
      "materialNumber": "MAT00001",
      "productDescription": "Organic Pasta 500g",
      "orderAreaId": 194,
      "similarity": "Same product type and organic category"
    }
  ],
  "alternativeSuggestion": {
    "orderAreaId": 190,
    "orderAreaDescription": "Ambient",
    "reasoning": "Could be ambient if shelf-stable"
  }
}
```

## Order Area Definitions

| OA ID | Description | Category |
|-------|-------------|----------|
| 190 | Ambient | Room temperature storage |
| 191 | Freezer | Frozen products |
| 192 | Chiller | Refrigerated products |
| 193 | Fresh Meat | Fresh meat and proteins |
| 194 | Produce | Fresh fruits, vegetables, organic |
| 195 | Bakery | Bread, baked goods, baking ingredients |

## Audit Trail

Every AI assignment includes:
- `AI_ASSIGNED`: Boolean flag
- `AI_CONFIDENCE`: Confidence score (0-100)
- `AI_MODEL`: Model identifier ("gpt-4o")
- `AI_TIMESTAMP`: ISO 8601 timestamp

This enables:
- Filtering AI vs human assignments
- Tracking AI accuracy over time
- Auditing high-risk assignments
- Performance monitoring

## Error Handling

1. **Token Fetch Failure**
   - Error message: "Token fetch failed: {status}"
   - User sees error dialog

2. **AI API Call Failure**
   - Error message: "AI API call failed: {status} - {details}"
   - User sees error dialog

3. **Invalid Prediction Format**
   - Validation catches missing fields
   - Error message: "Invalid prediction format. Missing fields: {list}"

4. **Invalid Order Area ID**
   - Validation checks against valid OAs (190-195)
   - Error message: "Invalid Order Area ID: {id}"

5. **Assignment Update Failure**
   - Error message: "Assignment failed: {error}"
   - Product remains unassigned

## Testing Instructions

### Test Case 1: High Confidence Assignment
1. Navigate to unassigned products
2. Select "Crackers Wheat 250g" (likely Bakery/195)
3. Click "Suggest OA via AI"
4. Verify confidence ≥80%
5. Click OK
6. Verify product moves to assigned list

### Test Case 2: Low Confidence Approval
1. Select product with ambiguous attributes
2. Click "Suggest OA via AI"
3. Verify confidence <80%
4. Review reasoning
5. Click Yes to approve
6. Verify assignment succeeds

### Test Case 3: Low Confidence Rejection
1. Select product
2. Click "Suggest OA via AI"
3. Verify confidence <80%
4. Click No to reject
5. Verify product remains unassigned

### Test Case 4: Multiple Assignments
1. Assign 5 products using AI
2. Navigate to assigned products list
3. Verify count increased by 5
4. Navigate to unassigned products list
5. Verify count decreased by 5

## Performance Considerations

- **CSV Loading**: Historical data loaded once on first prediction
- **API Call Latency**: ~2-5 seconds per prediction
- **Token Generation**: OAuth token cached for session
- **Concurrent Requests**: Not supported (button disabled during prediction)

## Future Enhancements

1. **Batch Processing**: Assign multiple products at once
2. **Confidence Threshold Configuration**: Admin can adjust 80% threshold
3. **Alternative Suggestions**: Allow users to select alternative OA
4. **Learning Feedback**: Store user corrections to improve model
5. **Historical Pattern Visualization**: Show why AI made decision
6. **Approval Queue**: Collect low-confidence items for batch review
7. **Model Comparison**: A/B test different models or temperatures
8. **Custom Business Rules**: Inject enterprise-specific assignment logic

## Files Modified/Created

### New Files
1. `app/dashboard/webapp/service/AIService.js` - AI integration module
2. `app/dashboard/webapp/historical_oa_assignments.csv` - Training data
3. `AI_OA_ASSIGNMENT_FEATURE.md` - This documentation

### Modified Files
1. `app/dashboard/webapp/view/ProductList.view.xml`
   - Added AI button
   - Changed table mode to SingleSelectMaster for unassigned
2. `app/dashboard/webapp/controller/ProductList.controller.js`
   - Added AI prediction workflow
   - Added confidence-based dialog logic
   - Added assignment update function

## Security Considerations

1. **Credentials**: AI Core credentials hardcoded in AIService.js
   - **TODO**: Move to environment variables or secure vault
2. **Authorization**: No user permission checks
   - **TODO**: Add role-based access control
3. **Data Privacy**: Product data sent to external AI service
   - **TODO**: Implement data masking for sensitive fields
4. **Audit Logging**: Limited audit trail
   - **TODO**: Add comprehensive audit logs for compliance

## Support & Troubleshooting

### Common Issues

**Issue**: "Token fetch failed: 401"
- **Cause**: Invalid client credentials
- **Solution**: Verify AI Core credentials in AIService.js

**Issue**: "AI API call failed: 404"
- **Cause**: Invalid deployment ID or endpoint
- **Solution**: Check API URL and deployment ID

**Issue**: Button stays disabled after selection
- **Cause**: Selection event not firing
- **Solution**: Check browser console for errors

**Issue**: CSV not found (404)
- **Cause**: Historical data file not accessible
- **Solution**: Verify file in webapp folder

## Contact

For questions or issues, contact the development team.
