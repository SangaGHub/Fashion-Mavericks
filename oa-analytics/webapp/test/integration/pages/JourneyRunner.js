sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"com/aldi/oaanalytics/test/integration/pages/MaterialOAMappingList.gen",
	"com/aldi/oaanalytics/test/integration/pages/MaterialOAMappingObjectPage.gen"
], function (JourneyRunner, MaterialOAMappingListGenerated, MaterialOAMappingObjectPageGenerated) {
    'use strict';

    const runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('com/aldi/oaanalytics') + '/test/flp.html#app-preview',
        pages: {
			onTheMaterialOAMappingListGenerated: MaterialOAMappingListGenerated,
			onTheMaterialOAMappingObjectPageGenerated: MaterialOAMappingObjectPageGenerated
        },
        async: true
    });

    return runner;
});

