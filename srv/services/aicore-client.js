import axios from 'axios';
import dotenv from 'dotenv';
import oauthService from './oauth-service.js';

dotenv.config();

/**
 * SAP AI Core API Client for aicore-sap deployments
 * Direct REST API calls (bypassing SDK due to local dev environment)
 */
class AICoreClient {
  constructor() {
    this.apiUrl = process.env.AICORE_API_URL;
    this.resourceGroup = process.env.AI_RESOURCE_GROUP || 'default';
    this.deploymentId = process.env.AI_DEPLOYMENT_ID;
    this.scenarioId = process.env.AI_SCENARIO_ID || 'foundation-models';
    this.modelName = process.env.AI_MODEL_NAME || 'sap-rpt-1.6';
  }

  /**
   * Get available deployments for the resource group
   */
  async getDeployments() {
    try {
      const token = await oauthService.getAccessToken();
      const response = await axios.get(
        `${this.apiUrl}/v2/lm/deployments`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'AI-Resource-Group': this.resourceGroup,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Failed to get deployments:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Call RPT tabular prediction API
   * RPT requires context rows (examples) + query row with PREDICT placeholder
   */
  async tabularPredict(contextRows, queryRow, targetColumn = 'order_area_id') {
    try {
      if (!this.deploymentId) {
        await this.findOrCreateDeployment();
      }

      console.log(`Calling RPT tabular prediction: ${this.deploymentId}`);

      const token = await oauthService.getAccessToken();
      const endpoint = `${this.apiUrl}/v2/inference/deployments/${this.deploymentId}/predict`;

      // Combine context rows + query row with PREDICT placeholder
      const allRows = [
        ...contextRows,
        { ...queryRow, [targetColumn]: 'PREDICT' }
      ];

      const payload = {
        rows: allRows,
        prediction_config: {
          target_columns: [
            {
              name: targetColumn,
              prediction_placeholder: 'PREDICT'
            }
          ]
        }
      };

      console.log(`POST to: ${endpoint} (${contextRows.length} context + 1 query row)`);

      const response = await axios.post(endpoint, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'AI-Resource-Group': this.resourceGroup,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });

      return response.data;
    } catch (error) {
      console.error('RPT inference failed:', error.response?.data || error.message);
      throw new Error(`RPT inference failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  /**
   * Find an existing deployment or provide instructions to create one
   */
  async findOrCreateDeployment() {
    try {
      const deployments = await this.getDeployments();

      // Find a running deployment
      const runningDeployment = deployments.resources?.find(
        d => d.status === 'RUNNING' && d.scenarioId === this.scenarioId
      );

      if (runningDeployment) {
        this.deploymentId = runningDeployment.id;
        console.log(`✓ Using existing deployment: ${this.deploymentId}`);
        return runningDeployment;
      }

      // No deployment found
      throw new Error(
        'No running AI Core deployment found. Please deploy a model in AI Core first.\n' +
        'Visit SAP AI Launchpad to create a deployment for scenario: ' + this.scenarioId
      );
    } catch (error) {
      console.error('Deployment lookup failed:', error.message);
      throw error;
    }
  }

  /**
   * Predict Order Area for a product using RPT tabular prediction
   * Uses historical assigned products as context and Material Master attributes for query product
   */
  async predictOrderArea(product, cds) {
    try {
      // Fetch context rows from assigned products (historical OA rules)
      // Get 3 examples from each Order Area (190-195) to provide balanced context
      const contextQuery = await cds.run(SELECT.from('aldi.oa.MaterialMaster').columns(
        'PRODUCT_DESCRIPTION as product_description',
        'MTART as material_type',
        'MATKL as article_hierarchy',
        'toMapping.ORDER_AREA_ID as order_area_id'
      ).where({
        'toMapping.ASSIGNMENT_STATUS': 'ASSIGNED'
      }).limit(18));  // 3 per OA × 6 OAs = 18 context rows

      if (!contextQuery || contextQuery.length < 2) {
        throw new Error('Insufficient historical data for RPT prediction. Need at least 2 assigned products.');
      }

      console.log(`Loaded ${contextQuery.length} context rows from assigned products`);

      // Fetch Material Master attributes for the unassigned product
      const productAttributes = await cds.run(SELECT.from('aldi.oa.MaterialMaster').columns(
        'PRODUCT_DESCRIPTION',
        'MTART',
        'MATKL'
      ).where({
        MATNR: product.materialNumber
      }));

      if (!productAttributes || productAttributes.length === 0) {
        throw new Error(`Material ${product.materialNumber} not found in Material Master`);
      }

      const materialData = productAttributes[0];

      // Query row: Unassigned product with its Material Master attributes
      const queryRow = {
        product_description: materialData.PRODUCT_DESCRIPTION,
        material_type: materialData.MTART,
        article_hierarchy: materialData.MATKL
      };

      console.log(`Query product: ${queryRow.product_description} (MTART: ${queryRow.material_type}, MATKL: ${queryRow.article_hierarchy})`);

      // Call RPT tabular prediction with historical context + query product
      const response = await this.tabularPredict(contextQuery, queryRow);

      // Extract prediction from RPT response
      const prediction = response.predictions[0];
      const orderAreaResult = prediction.order_area_id[0];

      // Map Order Area ID to description
      const orderAreaMap = {
        '190': 'Ambient',
        '191': 'Freezer',
        '192': 'Chiller',
        '193': 'Fresh Meat',
        '194': 'Produce',
        '195': 'Bakery'
      };

      const suggestedOrderAreaId = parseInt(orderAreaResult.prediction);
      const confidenceScore = Math.round(orderAreaResult.confidence * 100);

      return {
        suggestedOrderAreaId,
        suggestedOrderAreaDescription: orderAreaMap[suggestedOrderAreaId.toString()],
        confidenceScore,
        reasoning: `RPT model predicted Order Area ${suggestedOrderAreaId} (${orderAreaMap[suggestedOrderAreaId.toString()]}) ` +
                  `with ${confidenceScore}% confidence based on product description and context examples.`,
        matchedHistoricalProducts: [],
        alternativeSuggestion: null,
        productInput: {
          materialNumber: product.materialNumber,
          productDescription: product.productDescription,
          distributionCentre: product.distributionCentre,
          articleType: product.articleType
        },
        modelUsed: `ai-core-${this.modelName}`,
        timestamp: new Date().toISOString(),
        rptMetadata: {
          numContextRows: contextQuery.length,
          numQueryRows: 1,
          confidenceInterval: orderAreaResult.confidence_interval
        }
      };

    } catch (error) {
      console.error('Prediction failed:', error.message);
      throw error;
    }
  }

  /**
   * Validate and enhance the AI prediction response
   */
  validateAndEnhancePrediction(prediction, product) {
    // Validate required fields
    if (!prediction.suggestedOrderAreaId || !prediction.confidenceScore) {
      throw new Error('Invalid prediction format from AI model');
    }

    // Validate Order Area ID range
    if (prediction.suggestedOrderAreaId < 190 || prediction.suggestedOrderAreaId > 195) {
      throw new Error(`Invalid Order Area ID: ${prediction.suggestedOrderAreaId}`);
    }

    // Validate confidence score range
    if (prediction.confidenceScore < 0 || prediction.confidenceScore > 100) {
      prediction.confidenceScore = Math.max(0, Math.min(100, prediction.confidenceScore));
    }

    // Add standard fields
    return {
      ...prediction,
      matchedHistoricalProducts: prediction.matchedHistoricalProducts || [],
      alternativeSuggestion: prediction.alternativeSuggestion || null,
      productInput: {
        materialNumber: product.materialNumber,
        productDescription: product.productDescription,
        distributionCentre: product.distributionCentre,
        articleType: product.articleType
      },
      modelUsed: `ai-core-${this.modelName}`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validate configuration
   */
  validateConfig() {
    const errors = [];

    if (!this.apiUrl) {
      errors.push('AICORE_API_URL is not configured');
    }
    if (!this.resourceGroup) {
      errors.push('AI_RESOURCE_GROUP is not configured');
    }

    // OAuth validation
    const oauthValidation = oauthService.validateConfig();
    if (!oauthValidation.valid) {
      errors.push(...oauthValidation.errors);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Singleton instance
const aiCoreClient = new AICoreClient();

export default aiCoreClient;
