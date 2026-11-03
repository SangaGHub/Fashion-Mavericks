sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel"
], (Controller, JSONModel) => {
	"use strict";

	return Controller.extend("aldi.oa.dashboard.controller.Dashboard", {
		onInit() {
			// Initialize dashboard model
			const oDashboardModel = new JSONModel({
				metrics: {
					TotalProducts: 0,
					AssignedProducts: 0,
					UnassignedProducts: 0,
					AutomationRate: 0
				},
				orderAreas: []
			});
			this.getView().setModel(oDashboardModel, "dashboardModel");

			// Wait for view to be fully initialized
			this.getView().attachAfterRendering(() => {
				this._loadDashboardData();
				this._attachCardClickHandlers();
			}, this);
		},

		_attachCardClickHandlers() {
			// Add click handlers to summary cards and Order Area cards
			setTimeout(() => {
				const aSummaryCards = Array.from(document.querySelectorAll('.summaryCard:not(.orderAreaCard)'));
				aSummaryCards.forEach((oCard, index) => {
					oCard.style.cursor = 'pointer';
					oCard.addEventListener('click', () => {
						let sFilterType = 'all';
						if (index === 1) {
							sFilterType = "assigned";
						} else if (index === 2) {
							sFilterType = "unassigned";
						}
						this._navigateToProductList(sFilterType);
					});
				});

				// Add click handlers to Order Area cards
				const aOrderAreaCards = document.querySelectorAll('.orderAreaCard');
				const oDashboardModel = this.getView().getModel("dashboardModel");
				const aOrderAreas = oDashboardModel.getProperty("/orderAreas");

				aOrderAreaCards.forEach((oCard, index) => {
					oCard.style.cursor = 'pointer';
					oCard.addEventListener('click', () => {
						if (aOrderAreas && aOrderAreas[index]) {
							this.onOrderAreaClick(aOrderAreas[index].ORDER_AREA_ID);
						}
					});
				});
			}, 500);
		},

		_navigateToProductList(sFilterType) {
			const oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("productList", {
				filterType: sFilterType
			});
		},

		onNavigateToDetailList() {
			// Navigate to internal product list showing all products
			this._navigateToProductList('all');
		},

		_loadDashboardData() {
			const oView = this.getView();
			const oModel = oView.getModel();

			if (!oModel) {
				console.error("OData model is not initialized");
				return;
			}

			const oDashboardModel = oView.getModel("dashboardModel");

			// Load overall metrics using OData V4
			try {
				const oMetricsBinding = oModel.bindList("/DashboardMetrics");
				oMetricsBinding.requestContexts(0, 1).then((aContexts) => {
					if (aContexts.length > 0) {
						const metrics = aContexts[0].getObject();
						oDashboardModel.setProperty("/metrics", {
							TotalProducts: metrics.TotalProducts || 0,
							AssignedProducts: metrics.AssignedProducts || 0,
							UnassignedProducts: metrics.UnassignedProducts || 0,
							AutomationRate: Math.round(metrics.AutomationRate || 0)
						});
					}
				}).catch((oError) => {
					console.error("Error loading dashboard metrics:", oError);
				});

				// Load order area summary using OData V4
				const oOrderAreaBinding = oModel.bindList("/OrderAreaSummary", null, null, null, {
					$orderby: "ORDER_AREA_ID"
				});
				oOrderAreaBinding.requestContexts(0, 100).then((aContexts) => {
					const orderAreas = aContexts.map(oContext => {
						const oa = oContext.getObject();
						// OrderAreaSummary only has TotalProducts (count of assigned products)
						const assignedProducts = oa.TotalProducts || 0;
						// The UI shows "of X assigned" where X is TotalProducts
						// Target is 95% of TotalProducts
						const target = Math.ceil(assignedProducts * 0.95);
						// Assignment rate is 100% since we already have all products assigned
						// (the view only shows assigned products, so rate is always 100%)
						const assignmentRate = assignedProducts > 0 ? 100 : 0;

						return {
							ORDER_AREA_ID: oa.ORDER_AREA_ID,
							OA_DESCRIPTION: oa.OA_DESCRIPTION,
							TotalProducts: assignedProducts,
							AssignedProducts: assignedProducts,
							UnassignedProducts: 0,
							AssignmentRate: assignmentRate
						};
					});
					oDashboardModel.setProperty("/orderAreas", orderAreas);
				}).catch((oError) => {
					console.error("Error loading order area summary:", oError);
				});
			} catch (error) {
				console.error("Error in _loadDashboardData:", error);
			}
		},

		onOrderAreaClick(sOrderAreaId) {
			// Navigate to product list filtered by this Order Area
			const oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("productList", {
				filterType: "assigned"
			}, false);

			// Store the Order Area ID for filtering in the ProductList controller
			this.getOwnerComponent().setModel(
				new JSONModel({ selectedOrderAreaId: sOrderAreaId }),
				"filterModel"
			);
		}
	});
});
