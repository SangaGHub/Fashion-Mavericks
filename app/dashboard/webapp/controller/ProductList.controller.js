sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"aldi/oa/dashboard/service/AIService"
], (Controller, JSONModel, History, MessageToast, MessageBox, AIService) => {
	"use strict";

	return Controller.extend("aldi.oa.dashboard.controller.ProductList", {
		onInit() {
			// Initialize view model
			const oViewModel = new JSONModel({
				pageTitle: "Product List",
				filterMessage: "Loading products...",
				filterMessageType: "Information",
				countText: "Products (0)",
				filterType: "all",
				showAIButton: false,
				aiButtonEnabled: false,
				showUnassignButton: false,
				unassignButtonEnabled: false,
				tableMode: "None"
			});
			this.getView().setModel(oViewModel, "productListModel");

			// Get router and attach to route matched
			const oRouter = this.getOwnerComponent().getRouter();
			oRouter.getRoute("productList").attachPatternMatched(this._onRouteMatched, this);
		},

		_onRouteMatched(oEvent) {
			const sFilterType = oEvent.getParameter("arguments").filterType;
			const oViewModel = this.getView().getModel("productListModel");

			// Update view model based on filter type
			oViewModel.setProperty("/filterType", sFilterType);

			let sPageTitle, sFilterMessage, sFilterMessageType;

			switch(sFilterType) {
				case "all":
					sPageTitle = "All Products";
					sFilterMessage = "Showing all products - both assigned and not assigned to Order Areas";
					sFilterMessageType = "Information";
					break;
				case "assigned":
					sPageTitle = "Products Assigned to OA";
					sFilterMessage = "Showing only products that are assigned to Order Areas";
					sFilterMessageType = "Success";
					break;
				case "unassigned":
					sPageTitle = "Products Not Assigned to OA";
					sFilterMessage = "Showing only products that are NOT assigned to Order Areas";
					sFilterMessageType = "Error";
					break;
				default:
					sPageTitle = "Product List";
					sFilterMessage = "Invalid filter type";
					sFilterMessageType = "Warning";
			}

			oViewModel.setProperty("/pageTitle", sPageTitle);
			oViewModel.setProperty("/filterMessage", sFilterMessage);
			oViewModel.setProperty("/filterMessageType", sFilterMessageType);

			// Show AI button only for unassigned products
			const bShowAI = (sFilterType === "unassigned");
			oViewModel.setProperty("/showAIButton", bShowAI);
			oViewModel.setProperty("/aiButtonEnabled", false);

			// Show Unassign button only for assigned products
			const bShowUnassign = (sFilterType === "assigned");
			oViewModel.setProperty("/showUnassignButton", bShowUnassign);
			oViewModel.setProperty("/unassignButtonEnabled", false);

			oViewModel.setProperty("/tableMode", (bShowAI || bShowUnassign) ? "MultiSelect" : "None");

			// Apply filter to table
			this._applyFilter(sFilterType);
		},

		_applyFilter(sFilterType) {
			const oTable = this.byId("productTable");
			const oBinding = oTable.getBinding("items");

			// Check if there's an Order Area filter from the dashboard
			const oFilterModel = this.getOwnerComponent().getModel("filterModel");
			let aFilters = [];

			if (oFilterModel && oFilterModel.getProperty("/selectedOrderAreaId")) {
				const sOrderAreaId = oFilterModel.getProperty("/selectedOrderAreaId");
				// Create filter for the specific Order Area
				const oOrderAreaFilter = new sap.ui.model.Filter("ORDER_AREA_ID", sap.ui.model.FilterOperator.EQ, sOrderAreaId);
				aFilters.push(oOrderAreaFilter);

				// Clear the filter after applying it
				oFilterModel.setProperty("/selectedOrderAreaId", null);

				// Update the filter message to show Order Area filter
				const oViewModel = this.getView().getModel("productListModel");
				oViewModel.setProperty("/filterMessage", `Showing products assigned to Order Area ${sOrderAreaId}`);
			}

			// Change entity path based on filter type
			if (sFilterType === "unassigned") {
				// Bind to UnassignedMaterials entity for unassigned products
				oTable.bindItems({
					path: "/UnassignedMaterials",
					parameters: {
						$expand: "toMaterial"
					},
					filters: aFilters,
					template: oTable.getBindingInfo("items")?.template || oTable.getItems()[0]?.clone()
				});
			} else {
				// Bind to MaterialOAMapping for all/assigned products
				oTable.bindItems({
					path: "/MaterialOAMapping",
					parameters: {
						$expand: "toMaterial"
					},
					filters: aFilters,
					template: oTable.getBindingInfo("items")?.template || oTable.getItems()[0]?.clone()
				});
			}

			// Update the count
			this._updateProductCount(sFilterType);
		},

		_updateProductCount(sFilterType) {
			const oModel = this.getView().getModel();
			const oViewModel = this.getView().getModel("productListModel");

			// Determine which entity to query based on filter type
			let sEntity, sUrl;

			if (sFilterType === "unassigned") {
				sEntity = "UnassignedMaterials";
				sUrl = `/${sEntity}/$count`;
			} else if (sFilterType === "assigned") {
				sEntity = "MaterialOAMapping";
				sUrl = `/${sEntity}/$count`;
			} else {
				// For "all", sum both entities
				Promise.all([
					fetch(oModel.sServiceUrl + "/MaterialOAMapping/$count").then(r => r.text()),
					fetch(oModel.sServiceUrl + "/UnassignedMaterials/$count").then(r => r.text())
				]).then(([assigned, unassigned]) => {
					const iTotal = parseInt(assigned, 10) + parseInt(unassigned, 10);
					oViewModel.setProperty("/countText", `Products (${iTotal})`);
				}).catch(oError => {
					console.error("Error fetching product count:", oError);
					oViewModel.setProperty("/countText", "Products (Error)");
				});
				return;
			}

			// Single entity count
			fetch(oModel.sServiceUrl + sUrl)
				.then(response => response.text())
				.then(sCount => {
					const iCount = parseInt(sCount, 10);
					oViewModel.setProperty("/countText", `Products (${iCount})`);
				})
				.catch(oError => {
					console.error("Error fetching product count:", oError);
					oViewModel.setProperty("/countText", "Products (Error)");
				});
		},

		onNavBack() {
			const oHistory = History.getInstance();
			const sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				const oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("dashboard", {}, true);
			}
		},

		onExport() {
			MessageToast.show("Export functionality will be implemented");
		},

		onSearch(oEvent) {
			const sQuery = oEvent.getParameter("query");
			const oTable = this.byId("productTable");
			const oBinding = oTable.getBinding("items");

			if (!oBinding) {
				return;
			}

			// Create filter for material number (MATNR field)
			const aFilters = [];
			if (sQuery && sQuery.length > 0) {
				const oFilter = new sap.ui.model.Filter("MATNR", sap.ui.model.FilterOperator.Contains, sQuery);
				aFilters.push(oFilter);
			}

			// Apply filter to the binding
			oBinding.filter(aFilters);
		},

		onSelectionChange(oEvent) {
			const oViewModel = this.getView().getModel("productListModel");
			const aSelectedItems = oEvent.getSource().getSelectedItems();
			const sFilterType = oViewModel.getProperty("/filterType");

			// Enable AI button when at least one item is selected (unassigned view)
			if (sFilterType === "unassigned") {
				oViewModel.setProperty("/aiButtonEnabled", aSelectedItems.length > 0);
			}

			// Enable Unassign button when at least one item is selected (assigned view)
			if (sFilterType === "assigned") {
				oViewModel.setProperty("/unassignButtonEnabled", aSelectedItems.length > 0);
			}
		},

		async onAISuggest() {
			const oTable = this.byId("productTable");
			const aSelectedItems = oTable.getSelectedItems();

			if (!aSelectedItems || aSelectedItems.length === 0) {
				MessageBox.warning("Please select at least one product.");
				return;
			}

			// Get selected products data
			const aProducts = aSelectedItems.map(oItem => {
				const oContext = oItem.getBindingContext();
				const oProduct = oContext.getObject();
				return {
					materialNumber: oProduct.MATNR,
					productDescription: oProduct.toMaterial.PRODUCT_DESCRIPTION,
					distributionCentre: oProduct.DISTRIBUTION_CENTRE,
					articleType: oProduct.ARTICLE_TYPE,
					context: oContext,
					originalProduct: oProduct
				};
			});

			// Show busy indicator
			const oBusyDialog = new sap.m.BusyDialog({
				title: "AI Processing",
				text: `Analyzing ${aProducts.length} product(s) and predicting Order Areas...`
			});
			oBusyDialog.open();

			try {
				// Process all products in parallel
				const aPromises = aProducts.map(product =>
					AIService.predictOrderArea(product)
						.then(prediction => {
							AIService.validatePrediction(prediction);
							return { product: product, prediction: prediction, success: true };
						})
						.catch(error => {
							return { product: product, error: error.message, success: false };
						})
				);

				const aResults = await Promise.all(aPromises);

				oBusyDialog.close();

				// Separate successful and failed predictions
				const aSuccessful = aResults.filter(r => r.success);
				const aFailed = aResults.filter(r => !r.success);

				// Show error summary if any failed
				if (aFailed.length > 0) {
					const sErrorMsg = `Failed to predict ${aFailed.length} product(s):\n` +
						aFailed.map(r => `• ${r.product.materialNumber}: ${r.error}`).join("\n");
					MessageBox.error(sErrorMsg);
				}

				// Process successful predictions
				if (aSuccessful.length > 0) {
					// Group by confidence
					const aHighConfidence = aSuccessful.filter(r => r.prediction.confidenceScore >= 80);
					const aLowConfidence = aSuccessful.filter(r => r.prediction.confidenceScore < 80);

					// Show summary and ask for confirmation
					this._showBatchSummaryDialog(aHighConfidence, aLowConfidence);
				}

			} catch (error) {
				oBusyDialog.close();
				MessageBox.error(`AI prediction failed: ${error.message}`);
			}
		},

		_showBatchSummaryDialog(aHighConfidence, aLowConfidence) {
			const iTotal = aHighConfidence.length + aLowConfidence.length;
			let sMessage = `AI Analysis Complete for ${iTotal} product(s):\n\n`;

			if (aHighConfidence.length > 0) {
				sMessage += `✓ ${aHighConfidence.length} High Confidence (≥80%) - Ready for auto-assignment\n`;
			}

			if (aLowConfidence.length > 0) {
				sMessage += `⚠ ${aLowConfidence.length} Low Confidence (<80%) - Require human approval\n`;
			}

			sMessage += `\nView detailed predictions?`;

			MessageBox.confirm(sMessage, {
				title: "Batch AI Prediction Results",
				actions: [MessageBox.Action.YES, MessageBox.Action.NO],
				emphasizedAction: MessageBox.Action.YES,
				onClose: (sAction) => {
					if (sAction === MessageBox.Action.YES) {
						this._showDetailedPredictions(aHighConfidence, aLowConfidence);
					}
				}
			});
		},

		_showDetailedPredictions(aHighConfidence, aLowConfidence) {
			// Combine all results
			const aAllResults = [...aHighConfidence, ...aLowConfidence];

			// Build detailed message
			let sMessage = "";

			aAllResults.forEach((result, index) => {
				const p = result.prediction;
				sMessage += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
				sMessage += `${index + 1}. ${p.productInput.productDescription}\n`;
				sMessage += `   Material: ${p.productInput.materialNumber}\n`;
				sMessage += `   Suggested OA: ${p.suggestedOrderAreaId} - ${p.suggestedOrderAreaDescription}\n`;
				sMessage += `   Confidence: ${p.confidenceScore}%\n`;
				sMessage += `   Status: ${p.confidenceScore >= 80 ? "✓ High" : "⚠ Low"}\n`;
			});

			sMessage += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
			sMessage += `\nProceed with assignments?`;

			MessageBox.confirm(sMessage, {
				title: "Detailed Predictions",
				actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
				emphasizedAction: MessageBox.Action.OK,
				onClose: (sAction) => {
					if (sAction === MessageBox.Action.OK) {
						this._processBatchAssignments(aHighConfidence, aLowConfidence);
					}
				}
			});
		},

		async _processBatchAssignments(aHighConfidence, aLowConfidence) {
			// Show busy dialog
			const oBusyDialog = new sap.m.BusyDialog({
				text: "Processing assignments..."
			});
			oBusyDialog.open();

			try {
				const aToAssign = [];

				// Auto-assign high confidence
				aHighConfidence.forEach(result => {
					aToAssign.push({
						product: result.product,
						prediction: result.prediction
					});
				});

				// Ask for approval on low confidence
				if (aLowConfidence.length > 0) {
					oBusyDialog.close();

					const sMsg = `${aLowConfidence.length} product(s) have low confidence.\n\nApprove all low confidence assignments?`;

					MessageBox.warning(sMsg, {
						title: "Low Confidence - Approval Required",
						actions: [MessageBox.Action.YES, MessageBox.Action.NO],
						onClose: (sAction) => {
							if (sAction === MessageBox.Action.YES) {
								aLowConfidence.forEach(result => {
									aToAssign.push({
										product: result.product,
										prediction: result.prediction
									});
								});
							}
							this._executeBatchAssignments(aToAssign);
						}
					});
					return;
				}

				oBusyDialog.close();
				this._executeBatchAssignments(aToAssign);

			} catch (error) {
				oBusyDialog.close();
				MessageBox.error(`Batch assignment failed: ${error.message}`);
			}
		},

		async _executeBatchAssignments(aAssignments) {
			if (aAssignments.length === 0) {
				MessageToast.show("No products to assign.");
				return;
			}

			const oBusyDialog = new sap.m.BusyDialog({
				text: `Assigning ${aAssignments.length} product(s)...`
			});
			oBusyDialog.open();

			const oModel = this.getView().getModel();
			let iSuccessCount = 0;
			let iFailCount = 0;

			try {
				// Process assignments sequentially to avoid conflicts
				for (const assignment of aAssignments) {
					try {
						await this._assignSingleProduct(assignment.product, assignment.prediction, oModel);
						iSuccessCount++;
					} catch (error) {
						console.error(`Failed to assign ${assignment.product.MATNR}:`, error);
						iFailCount++;
					}
				}

				oBusyDialog.close();

				// Show summary
				let sMessage = `Batch Assignment Complete:\n\n`;
				sMessage += `✓ Successfully assigned: ${iSuccessCount}\n`;
				if (iFailCount > 0) {
					sMessage += `✗ Failed: ${iFailCount}\n`;
				}

				MessageBox.success(sMessage, {
					onClose: () => {
						// Refresh the list
						this.byId("productTable").getBinding("items").refresh();
						this._updateProductCount(this._getCurrentFilters());

						// Clear selection
						this.byId("productTable").removeSelections(true);
					}
				});

			} catch (error) {
				oBusyDialog.close();
				MessageBox.error(`Batch assignment failed: ${error.message}`);
			}
		},

		async _assignSingleProduct(oProduct, prediction, oModel) {
			// For UnassignedMaterials, we need to:
			// 1. INSERT new record into MaterialOAMapping
			// 2. DELETE record from UnassignedMaterials

			const sCurrentPath = oProduct.context?.getPath();

			if (sCurrentPath && sCurrentPath.startsWith("/UnassignedMaterials")) {
				// Working with UnassignedMaterials entity
				const oUnassignedData = oProduct.context.getObject();

				// 1. Create new entry in MaterialOAMapping
				const oMappingListBinding = oModel.bindList("/MaterialOAMapping");
				const oMappingContext = oMappingListBinding.create({
					MANDT: oUnassignedData.MANDT,
					MATNR: oUnassignedData.MATNR,
					ORDER_AREA_ID: prediction.suggestedOrderAreaId,
					OA_DESCRIPTION: prediction.suggestedOrderAreaDescription,
					DISTRIBUTION_CENTRE: oUnassignedData.DISTRIBUTION_CENTRE,
					ARTICLE_TYPE: oUnassignedData.ARTICLE_TYPE,
					ASSIGNED_BY: "AI_SYSTEM",
					ASSIGNED_AT: new Date().toISOString(),
					LAST_CHANGED_AT: new Date().toISOString()
				});

				// 2. Delete from UnassignedMaterials
				oProduct.context.delete();

				// Submit both operations in one batch
				await oModel.submitBatch(oModel.getUpdateGroupId());

			} else {
				// Old flow for MaterialOAMapping (shouldn't happen with new structure)
				const oContext = oProduct.context ||
					this.byId("productTable").getItems()
						.find(item => item.getBindingContext()?.getObject()?.MATNR === oProduct.materialNumber)
						?.getBindingContext();

				if (!oContext) {
					throw new Error(`Context not found for product ${oProduct.materialNumber}`);
				}

				// Update the existing record
				oContext.setProperty("ORDER_AREA_ID", prediction.suggestedOrderAreaId);
				oContext.setProperty("OA_DESCRIPTION", prediction.suggestedOrderAreaDescription);

				await oModel.submitBatch(oModel.getUpdateGroupId());
			}
		},

		async onUnassign() {
			const oTable = this.byId("productTable");
			const aSelectedItems = oTable.getSelectedItems();

			if (!aSelectedItems || aSelectedItems.length === 0) {
				MessageBox.warning("Please select at least one product to unassign.");
				return;
			}

			// Confirm unassignment
			const sMessage = `Are you sure you want to unassign ${aSelectedItems.length} product(s) from their Order Areas?\n\nThis will move them to the unassigned products list.`;

			MessageBox.confirm(sMessage, {
				title: "Confirm Unassignment",
				actions: [MessageBox.Action.YES, MessageBox.Action.NO],
				emphasizedAction: MessageBox.Action.YES,
				onClose: async (sAction) => {
					if (sAction === MessageBox.Action.YES) {
						await this._executeUnassignments(aSelectedItems);
					}
				}
			});
		},

		async _executeUnassignments(aSelectedItems) {
			const oBusyDialog = new sap.m.BusyDialog({
				text: `Unassigning ${aSelectedItems.length} product(s)...`
			});
			oBusyDialog.open();

			const oModel = this.getView().getModel();
			let iSuccessCount = 0;
			let iFailCount = 0;

			try {
				// Process unassignments sequentially
				for (const oItem of aSelectedItems) {
					try {
						const oContext = oItem.getBindingContext();
						const oAssignedProduct = oContext.getObject();

						// 1. Create new entry in UnassignedMaterials
						const oUnassignedListBinding = oModel.bindList("/UnassignedMaterials");
						oUnassignedListBinding.create({
							MANDT: oAssignedProduct.MANDT,
							MATNR: oAssignedProduct.MATNR,
							DISTRIBUTION_CENTRE: oAssignedProduct.DISTRIBUTION_CENTRE,
							ARTICLE_TYPE: oAssignedProduct.ARTICLE_TYPE
						});

						// 2. Delete from MaterialOAMapping
						oContext.delete();

						// Submit both operations in one batch
						await oModel.submitBatch(oModel.getUpdateGroupId());

						iSuccessCount++;
					} catch (error) {
						console.error(`Failed to unassign product:`, error);
						iFailCount++;
					}
				}

				oBusyDialog.close();

				// Show summary
				let sMessage = `Unassignment Complete:\n\n`;
				sMessage += `✓ Successfully unassigned: ${iSuccessCount}\n`;
				if (iFailCount > 0) {
					sMessage += `✗ Failed: ${iFailCount}\n`;
				}

				MessageBox.success(sMessage, {
					onClose: () => {
						// Refresh the list
						this.byId("productTable").getBinding("items").refresh();
						this._updateProductCount(this._getCurrentFilters());

						// Clear selection
						this.byId("productTable").removeSelections(true);
					}
				});

			} catch (error) {
				oBusyDialog.close();
				MessageBox.error(`Unassignment failed: ${error.message}`);
			}
		},

		_getCurrentFilters() {
			const oViewModel = this.getView().getModel("productListModel");
			const sFilterType = oViewModel.getProperty("/filterType");

			// Return the filter type string instead of Filter objects
			// since we're now switching entity paths instead of filtering
			return sFilterType;
		}
	});
});
