import aiCoreClient from './services/aicore-client.js';
import cds from '@sap/cds';

/**
 * CAP Service Implementation for OA Assignment Service
 * Handles the predictOrderArea action using SAP AI Core
 */
export default function (srv) {

  /**
   * Handler for predictOrderArea action
   * Called from the frontend to get AI-powered Order Area predictions
   */
  srv.on('predictOrderArea', async (req) => {
    try {
      const productData = req.data.productData;

      console.log('Received prediction request for:', productData.materialNumber);

      // Validate input
      if (!productData || !productData.productDescription) {
        throw new Error('Product description is required');
      }

      // Check AI Core configuration
      const configValidation = aiCoreClient.validateConfig();
      if (!configValidation.valid) {
        console.warn('AI Core not configured:', configValidation.errors);

        // Fallback to mock service
        return await getMockPrediction(productData);
      }

      // Call AI Core for prediction
      try {
        // Pass CDS instance so RPT can fetch historical context and Material Master attributes
        const prediction = await aiCoreClient.predictOrderArea(productData, cds);

        console.log(`✓ AI Core prediction: OA-${prediction.suggestedOrderAreaId} (${prediction.confidenceScore}%)`);

        return prediction;

      } catch (aiError) {
        console.error('AI Core prediction failed, falling back to mock:', aiError.message);

        // Fallback to mock service on AI Core error
        return await getMockPrediction(productData);
      }

    } catch (error) {
      console.error('Prediction error:', error);
      req.error(500, `Prediction failed: ${error.message}`);
    }
  });

  /**
   * Fallback mock prediction when AI Core is unavailable
   */
  async function getMockPrediction(product) {
    console.log('Using mock prediction service (fallback)');

    const desc = product.productDescription.toLowerCase();
    let suggestedOA, oaDesc, confidence, reasoning;

    // Rule-based mock prediction (same logic as before)
    if (desc.includes('meat') || desc.includes('chicken') || desc.includes('turkey') || desc.includes('beef')) {
      suggestedOA = 193;
      oaDesc = "Fresh Meat";
      confidence = 95;
      reasoning = "Product description clearly identifies meat/poultry product (MOCK SERVICE - AI Core unavailable)";
    } else if (desc.includes('bread') || desc.includes('bun') || desc.includes('roll') || desc.includes('bakery') || desc.includes('crackers')) {
      suggestedOA = 195;
      oaDesc = "Bakery";
      confidence = 88;
      reasoning = "Product description indicates a baked goods item (MOCK SERVICE - AI Core unavailable)";
    } else if (desc.includes('frozen') || desc.includes('ice')) {
      suggestedOA = 191;
      oaDesc = "Freezer";
      confidence = 92;
      reasoning = "Product description contains 'frozen' keyword (MOCK SERVICE - AI Core unavailable)";
    } else if (desc.includes('vegetable') || desc.includes('fruit') || desc.includes('organic') || desc.includes('lettuce') || desc.includes('garlic')) {
      suggestedOA = 194;
      oaDesc = "Produce";
      confidence = 90;
      reasoning = "Product is fresh produce based on description (MOCK SERVICE - AI Core unavailable)";
    } else if (desc.includes('cheese') || desc.includes('dairy') || desc.includes('yogurt') || desc.includes('dip') || desc.includes('coleslaw')) {
      suggestedOA = 192;
      oaDesc = "Chiller";
      confidence = 87;
      reasoning = "Product requires refrigeration based on description (MOCK SERVICE - AI Core unavailable)";
    } else {
      suggestedOA = 190;
      oaDesc = "Ambient";
      confidence = 75;
      reasoning = "Product appears to be shelf-stable (MOCK SERVICE - AI Core unavailable)";
    }

    return {
      suggestedOrderAreaId: suggestedOA,
      suggestedOrderAreaDescription: oaDesc,
      confidenceScore: confidence,
      reasoning: reasoning,
      matchedHistoricalProducts: [],
      alternativeSuggestion: null,
      productInput: product,
      modelUsed: "mock-fallback",
      timestamp: new Date().toISOString()
    };
  }

  console.log('✓ AI Core prediction service initialized');
}
