sap.ui.define([], () => {
	"use strict";

	return {
		/**
		 * Call backend CAP service for AI-powered Order Area prediction
		 * This now uses SAP AI Core via the backend service
		 */
		async predictOrderArea(product) {
			try {
				// Get the OData model
				const oModel = sap.ui.getCore().byId("container-dashboard---app").getModel();

				if (!oModel) {
					throw new Error("OData model not available");
				}

				// Prepare the request payload
				const requestData = {
					productData: {
						materialNumber: product.materialNumber,
						productDescription: product.productDescription,
						distributionCentre: product.distributionCentre,
						articleType: product.articleType
					}
				};

				console.log('Calling AI prediction service for:', product.materialNumber);

				// Call the CAP service action
				const oAction = oModel.bindContext("/predictOrderArea(...)");
				oAction.setParameter("productData", requestData.productData);

				// Execute the action
				await oAction.execute();

				// Get the result
				const result = oAction.getBoundContext().getObject();

				console.log('✓ Prediction received:', result);

				// Validate the response
				this.validatePrediction(result);

				return result;

			} catch (error) {
				console.error("AI prediction error:", error);

				// If backend call fails, fall back to mock prediction
				if (error.message.includes("OData") || error.message.includes("network")) {
					console.warn("Backend unavailable, using mock prediction");
					return this._generateMockPrediction(product);
				}

				throw error;
			}
		},

		/**
		 * Fallback mock prediction (used when backend is unavailable)
		 */
		_generateMockPrediction(product) {
			const desc = product.productDescription.toLowerCase();
			let suggestedOA, oaDesc, confidence, reasoning, matches;

			// Rule-based mock prediction (check meat/poultry first before frozen to handle frozen meat correctly)
			if (desc.includes('meat') || desc.includes('chicken') || desc.includes('turkey') || desc.includes('beef')) {
				suggestedOA = 193;
				oaDesc = "Fresh Meat";
				confidence = 95;
				reasoning = "Product description clearly identifies meat/poultry product (FALLBACK: Backend unavailable)";
				matches = [
					{ materialNumber: "MAT00159", productDescription: "Turkey Breast Sliced 200g", orderAreaId: 193, similarity: "Same protein category" },
					{ materialNumber: "MAT00193", productDescription: "Chicken Wings 1kg", orderAreaId: 193, similarity: "Poultry products" }
				];
			} else if (desc.includes('bread') || desc.includes('bun') || desc.includes('roll') || desc.includes('bakery') || desc.includes('crackers')) {
				suggestedOA = 195;
				oaDesc = "Bakery";
				confidence = 88;
				reasoning = "Product description indicates a baked goods item (FALLBACK: Backend unavailable)";
				matches = [
					{ materialNumber: "MAT00007", productDescription: "Tea Bags English Breakfast 80ct", orderAreaId: 195, similarity: "Bakery department item" },
					{ materialNumber: "MAT00012", productDescription: "Honey Pure 500g", orderAreaId: 195, similarity: "Common bakery accompaniment" }
				];
			} else if (desc.includes('frozen') || desc.includes('ice')) {
				suggestedOA = 191;
				oaDesc = "Freezer";
				confidence = 92;
				reasoning = "Product description contains 'frozen' keyword (FALLBACK: Backend unavailable)";
				matches = [
					{ materialNumber: "MAT00086", productDescription: "Frozen Berries Mixed 500g", orderAreaId: 191, similarity: "Both are frozen products" },
					{ materialNumber: "MAT00090", productDescription: "Frozen Spinach 450g", orderAreaId: 191, similarity: "Similar frozen food category" }
				];
			} else if (desc.includes('vegetable') || desc.includes('fruit') || desc.includes('organic') || desc.includes('lettuce') || desc.includes('garlic')) {
				suggestedOA = 194;
				oaDesc = "Produce";
				confidence = 90;
				reasoning = "Product is fresh produce based on description (FALLBACK: Backend unavailable)";
				matches = [
					{ materialNumber: "MAT00001", productDescription: "Organic Pasta 500g", orderAreaId: 194, similarity: "Organic product category" },
					{ materialNumber: "MAT00224", productDescription: "Garlic Bulbs 3pk", orderAreaId: 194, similarity: "Fresh produce item" }
				];
			} else if (desc.includes('cheese') || desc.includes('dairy') || desc.includes('yogurt') || desc.includes('dip') || desc.includes('coleslaw')) {
				suggestedOA = 192;
				oaDesc = "Chiller";
				confidence = 87;
				reasoning = "Product requires refrigeration based on description (FALLBACK: Backend unavailable)";
				matches = [
					{ materialNumber: "MAT00111", productDescription: "Mozzarella 125g", orderAreaId: 192, similarity: "Cheese/dairy product" },
					{ materialNumber: "MAT00120", productDescription: "Dip Sour Cream & Chive 200g", orderAreaId: 192, similarity: "Refrigerated dip" }
				];
			} else {
				// Default to Ambient for shelf-stable items
				suggestedOA = 190;
				oaDesc = "Ambient";
				confidence = 75;
				reasoning = "Product appears to be shelf-stable (FALLBACK: Backend unavailable)";
				matches = [
					{ materialNumber: "MAT00009", productDescription: "Flour Plain 1.5kg", orderAreaId: 190, similarity: "Dry goods category" },
					{ materialNumber: "MAT00024", productDescription: "Water Sparkling 1L", orderAreaId: 190, similarity: "Shelf-stable beverage" }
				];
			}

			return {
				suggestedOrderAreaId: suggestedOA,
				suggestedOrderAreaDescription: oaDesc,
				confidenceScore: confidence,
				reasoning: reasoning,
				matchedHistoricalProducts: matches,
				alternativeSuggestion: null,
				productInput: product,
				modelUsed: "mock-fallback",
				timestamp: new Date().toISOString()
			};
		},

		/**
		 * Validate prediction result
		 */
		validatePrediction(prediction) {
			const required = ["suggestedOrderAreaId", "suggestedOrderAreaDescription", "confidenceScore", "reasoning", "matchedHistoricalProducts"];
			const missing = required.filter(field => !(field in prediction));

			if (missing.length > 0) {
				throw new Error(`Invalid prediction format. Missing fields: ${missing.join(", ")}`);
			}

			if (prediction.confidenceScore < 0 || prediction.confidenceScore > 100) {
				throw new Error("Confidence score must be between 0 and 100");
			}

			const validOAs = [190, 191, 192, 193, 194, 195];
			if (!validOAs.includes(prediction.suggestedOrderAreaId)) {
				throw new Error(`Invalid Order Area ID: ${prediction.suggestedOrderAreaId}`);
			}

			return true;
		}
	};
});
