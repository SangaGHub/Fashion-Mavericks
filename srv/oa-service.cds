using aldi.oa from '../db/schema';

/**
 * OA Assignment Monitor Service
 */
service OAAssignmentService {

  // Main entities
  @readonly entity MaterialMaster as projection on oa.MaterialMaster;

  @cds.redirection.target
  @Aggregation.ApplySupported: {
    Transformations: [
      'aggregate',
      'groupby',
      'filter'
    ],
    Rollup: #None,
    PropertyRestrictions: true
  }
  entity MaterialOAMapping as projection on oa.MaterialOAMapping;

  entity UnassignedMaterials as projection on oa.UnassignedMaterials;

  @readonly entity OARules as projection on oa.OARules;

  // Dashboard views
  @readonly entity DashboardMetrics as projection on oa.DashboardMetrics;
  @readonly entity OrderAreaSummary as projection on oa.OrderAreaSummary;
  @readonly entity DistributionCentreSummary as projection on oa.DistributionCentreSummary;

  // AI Prediction Action
  action predictOrderArea(productData: {
    materialNumber: String;
    productDescription: String;
    distributionCentre: String;
    articleType: String;
  }) returns {
    suggestedOrderAreaId: Integer;
    suggestedOrderAreaDescription: String;
    confidenceScore: Integer;
    reasoning: String;
    matchedHistoricalProducts: array of {
      materialNumber: String;
      productDescription: String;
      orderAreaId: Integer;
      similarity: String;
    };
    alternativeSuggestion: {
      orderAreaId: Integer;
      orderAreaDescription: String;
      reasoning: String;
    };
    productInput: {
      materialNumber: String;
      productDescription: String;
      distributionCentre: String;
      articleType: String;
    };
    modelUsed: String;
    timestamp: String;
  };
}
