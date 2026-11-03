sap.ui.define([
	"sap/ui/core/UIComponent"
], (UIComponent) => {
	"use strict";

	return UIComponent.extend("aldi.oa.dashboard.Component", {
		metadata: {
			manifest: "json",
			interfaces: [
				"sap.ui.core.IAsyncContentCreation"
			]
		},

		init() {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// initialize the router
			this.getRouter().initialize();
		}
	});
});
