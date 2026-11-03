/**
 * SAP AI Core Configuration
 *
 * This file contains the configuration for connecting to SAP AI Core
 * and the deployment details for the Order Area prediction model.
 */

export const AI_CORE_CONFIG = {
  // AI Core Service Connection
  // These will be automatically loaded from BTP destination "AICORE_DESTINATION"
  // or can be set via environment variables
  destination: process.env.AICORE_DESTINATION || 'AICORE_DESTINATION',

  // Deployment Configuration
  deployment: {
    // Replace with your actual deployment ID after deploying the model
    deploymentId: process.env.AI_DEPLOYMENT_ID || '',

    // Model configuration
    modelName: process.env.AI_MODEL_NAME || 'gpt-4',
    modelVersion: process.env.AI_MODEL_VERSION || 'latest'
  },

  // Orchestration Configuration
  orchestration: {
    // LLM Module Configuration
    llm: {
      model_name: 'gpt-4',
      model_params: {
        max_tokens: 1000,
        temperature: 0.1, // Low temperature for consistent classification
        frequency_penalty: 0,
        presence_penalty: 0
      }
    },

    // Template Configuration
    templating: {
      template: [
        {
          role: 'system',
          content: `You are an expert retail product classifier for ALDI distribution centers.
Your task is to classify products into the correct Order Area based on storage and handling requirements.

Available Order Areas:
- 190: Ambient (shelf-stable, room temperature storage)
- 191: Freezer (frozen products, -18°C storage)
- 192: Chiller (refrigerated products, 0-5°C storage)
- 193: Fresh Meat (fresh meat and poultry, 0-2°C storage)
- 194: Produce (fresh fruits and vegetables, 5-10°C storage)
- 195: Bakery (bread, baked goods, room temperature)

Classification Rules:
1. Fresh meat and poultry products → 193 Fresh Meat
2. Frozen products (explicitly labeled "frozen") → 191 Freezer
3. Dairy, cheese, deli items, dips → 192 Chiller
4. Fresh fruits and vegetables → 194 Produce
5. Bread, baked goods, crackers → 195 Bakery
6. Shelf-stable packaged goods → 190 Ambient

You must respond in valid JSON format with this structure:
{
  "suggestedOrderAreaId": <number>,
  "suggestedOrderAreaDescription": "<string>",
  "confidenceScore": <number 0-100>,
  "reasoning": "<explanation>",
  "matchedHistoricalProducts": [],
  "alternativeSuggestion": null
}`
        },
        {
          role: 'user',
          content: `Classify this product:

Product Description: {{?productDescription}}
Material Number: {{?materialNumber}}
Distribution Centre: {{?distributionCentre}}
Article Type: {{?articleType}}

Respond with JSON only, no additional text.`
        }
      ]
    },

    // Filtering Configuration (optional content filtering)
    filtering: {
      input: {
        filters: [
          {
            type: 'azure_content_safety',
            config: {
              Hate: 0,
              SelfHarm: 0,
              Sexual: 0,
              Violence: 0
            }
          }
        ]
      }
    }
  },

  // Fallback Configuration
  fallback: {
    // If AI Core is unavailable, use mock service
    useMockOnError: true,

    // Timeout for AI Core requests (ms)
    timeout: 10000
  },

  // Order Area Mapping
  orderAreas: {
    190: 'Ambient',
    191: 'Freezer',
    192: 'Chiller',
    193: 'Fresh Meat',
    194: 'Produce',
    195: 'Bakery'
  }
};

/**
 * Validate that required configuration is present
 */
export function validateConfig() {
  const errors = [];

  if (!AI_CORE_CONFIG.destination) {
    errors.push('AICORE_DESTINATION is not configured');
  }

  // Deployment ID is optional for development (will use mock)
  // but required for production
  if (process.env.NODE_ENV === 'production' && !AI_CORE_CONFIG.deployment.deploymentId) {
    errors.push('AI_DEPLOYMENT_ID is required in production');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export default AI_CORE_CONFIG;
