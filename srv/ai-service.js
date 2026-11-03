const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {

    /**
     * AI Core Proxy - Handles AI prediction requests to avoid CORS issues
     */
    this.on('predictOrderArea', async (req) => {
        const { productData } = req.data;

        try {
            // SAP AI Core configuration (read from environment / .env — never hardcode secrets)
            const config = {
                clientId: process.env.AICORE_CLIENT_ID,
                clientSecret: process.env.AICORE_CLIENT_SECRET,
                authUrl: process.env.AICORE_AUTH_URL,
                apiUrl: process.env.AICORE_API_URL
            };

            // Get OAuth token
            const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

            const tokenResponse = await fetch(config.authUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: 'grant_type=client_credentials'
            });

            if (!tokenResponse.ok) {
                throw new Error(`Token fetch failed: ${tokenResponse.status}`);
            }

            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.access_token;

            // Load historical data from CSV
            const fs = require('fs');
            const path = require('path');
            const csvPath = path.join(__dirname, '../webapp/historical_oa_assignments.csv');
            const csvContent = fs.readFileSync(csvPath, 'utf-8');

            const lines = csvContent.split('\n');
            const historicalData = lines.slice(1, 21) // Top 20
                .filter(line => line.trim())
                .map(line => {
                    const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g).map(v => v.replace(/"/g, '').trim());
                    return `${values[0]}|${values[1]}|${values[2]}|${values[3]}|${values[4]}|${values[5]}`;
                })
                .join('\n');

            // Build prompts
            const systemPrompt = `You are an expert SAP Order Area (OA) assignment system. Your task is to predict the most suitable Order Area ID for unassigned products based on historical assignment patterns.

AVAILABLE ORDER AREAS:
- 190: Ambient (room temperature storage products)
- 191: Freezer (frozen products)
- 192: Chiller (refrigerated products)
- 193: Fresh Meat (fresh meat and proteins)
- 194: Produce (fresh fruits, vegetables, and organic items)
- 195: Bakery (bread, baked goods, baking ingredients)

ASSIGNMENT RULES:
1. Analyze product description, distribution centre, and article type
2. Compare with historical patterns of similar products
3. Consider product category, storage requirements, and handling needs
4. Provide confidence score (0-100%) based on pattern match strength
5. Include reasoning with matched historical examples
6. Suggest alternative OA if confidence is moderate

OUTPUT FORMAT (strict JSON):
{
  "suggestedOrderAreaId": number,
  "suggestedOrderAreaDescription": string,
  "confidenceScore": number (0-100),
  "reasoning": string (2-3 sentences explaining the decision),
  "matchedHistoricalProducts": [
    {
      "materialNumber": string,
      "productDescription": string,
      "orderAreaId": number,
      "similarity": string
    }
  ],
  "alternativeSuggestion": {
    "orderAreaId": number,
    "orderAreaDescription": string,
    "reasoning": string
  } or null
}`;

            const userPrompt = `HISTORICAL ASSIGNMENT DATA (sample):
${historicalData}

PRODUCT TO CLASSIFY:
Material Number: ${productData.materialNumber}
Product Description: ${productData.productDescription}
Distribution Centre: ${productData.distributionCentre}
Article Type: ${productData.articleType}

Based on the historical patterns above, predict the most suitable Order Area ID for this product. Provide your response in the exact JSON format specified.`;

            // Call AI Core API
            const aiResponse = await fetch(config.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'AI-Resource-Group': 'default'
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    temperature: 0.2,
                    max_tokens: 1000,
                    response_format: { type: "json_object" }
                })
            });

            if (!aiResponse.ok) {
                const errorText = await aiResponse.text();
                throw new Error(`AI API call failed: ${aiResponse.status} - ${errorText}`);
            }

            const aiData = await aiResponse.json();
            const prediction = JSON.parse(aiData.choices[0].message.content);

            // Add metadata
            prediction.productInput = productData;
            prediction.modelUsed = "gpt-4o";
            prediction.timestamp = new Date().toISOString();

            return prediction;

        } catch (error) {
            console.error('AI prediction error:', error);
            throw new Error(`AI prediction failed: ${error.message}`);
        }
    });
});
