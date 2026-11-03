sap.ui.define([
	"sap/ui/core/mvc/Controller"
], (Controller) => {
	"use strict";

	return Controller.extend("aldi.oa.dashboard.controller.App", {
		onInit() {
			// Get the router
			this.getOwnerComponent().getRouter().initialize();
		}
	});
});
