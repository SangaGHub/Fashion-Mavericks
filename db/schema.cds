namespace aldi.oa;

using { cuid, managed } from '@sap/cds/common';

/**
 * Material Master Data
 */
entity MaterialMaster {
  key MANDT                : String(3);
  key MATNR                : String(20);
      ERSDA                : Date;
      CREATED_AT_TIME      : Time;
      ERNAM                : String(20);
      LAEDA                : Date;
      AENAM                : String(20);
      VPSTA                : String(2);
      PSTAT                : String(2);
      LVORM                : String(1);
      MTART                : String(10);
      MBRSH                : String(1);
      MATKL                : String(10);
      BISMT                : String(20);
      MEINS                : String(10);
      BSTME                : String(10);
      PRODUCT_DESCRIPTION  : String(100);

      // Association to Material OA Mapping or Unassigned
      toMapping            : Association to MaterialOAMapping on toMapping.MATNR = MATNR;
      toUnassigned         : Association to UnassignedMaterials on toUnassigned.MATNR = MATNR;
}

/**
 * Material to Order Area Assignment - Only ASSIGNED products
 */
@Aggregation.ApplySupported.PropertyRestrictions: true
@Aggregation.CustomAggregate #TotalCount: 'Edm.Int32'
@UI.LineItem: [
  {
    $Type: 'UI.DataField',
    Value: MATNR,
    Label: 'Material Number'
  },
  {
    $Type: 'UI.DataField',
    Value: toMaterial.PRODUCT_DESCRIPTION,
    Label: 'Product Description'
  },
  {
    $Type: 'UI.DataField',
    Value: ORDER_AREA_ID,
    Label: 'Order Area ID'
  },
  {
    $Type: 'UI.DataField',
    Value: OA_DESCRIPTION,
    Label: 'Order Area'
  },
  {
    $Type: 'UI.DataField',
    Value: DISTRIBUTION_CENTRE,
    Label: 'Distribution Centre'
  },
  {
    $Type: 'UI.DataField',
    Value: ARTICLE_TYPE,
    Label: 'Article Type'
  }
]
@UI.SelectionFields: [
  ORDER_AREA_ID,
  OA_DESCRIPTION,
  DISTRIBUTION_CENTRE,
  ARTICLE_TYPE
]
entity MaterialOAMapping {
  key MANDT                : String(3);
  key MATNR                : String(20) @title: 'Material Number';
      ORDER_AREA_ID        : Integer @title: 'Order Area ID';
      OA_DESCRIPTION       : String(50) @title: 'Order Area Description';
      DISTRIBUTION_CENTRE  : String(10) @title: 'Distribution Centre';
      ARTICLE_TYPE         : String(10) @title: 'Article Type';
      ASSIGNED_BY          : String(20) @title: 'Assigned By';
      ASSIGNED_AT          : Timestamp @title: 'Assigned At';
      LAST_CHANGED_AT      : Timestamp @title: 'Last Changed';

      // Virtual field for aggregation
      virtual TotalCount : Integer default 1;

      // Associations
      toMaterial           : Association to MaterialMaster on toMaterial.MATNR = MATNR;
      toRules              : Association to many OARules on toRules.ORDER_AREA_ID = ORDER_AREA_ID;
}

/**
 * Unassigned Materials - Products awaiting OA assignment
 */
@UI.LineItem: [
  {
    $Type: 'UI.DataField',
    Value: MATNR,
    Label: 'Material Number'
  },
  {
    $Type: 'UI.DataField',
    Value: toMaterial.PRODUCT_DESCRIPTION,
    Label: 'Product Description'
  },
  {
    $Type: 'UI.DataField',
    Value: DISTRIBUTION_CENTRE,
    Label: 'Distribution Centre'
  },
  {
    $Type: 'UI.DataField',
    Value: ARTICLE_TYPE,
    Label: 'Article Type'
  },
  {
    $Type: 'UI.DataField',
    Value: CREATED_AT,
    Label: 'Created At'
  }
]
@UI.SelectionFields: [
  DISTRIBUTION_CENTRE,
  ARTICLE_TYPE
]
entity UnassignedMaterials {
  key MANDT                : String(3);
  key MATNR                : String(20) @title: 'Material Number';
      DISTRIBUTION_CENTRE  : String(10) @title: 'Distribution Centre';
      ARTICLE_TYPE         : String(10) @title: 'Article Type';
      CREATED_AT           : Timestamp @title: 'Created At';
      LAST_PREDICTION_AT   : Timestamp @title: 'Last Prediction';

      // Virtual field for criticality
      virtual AssignmentStatusCriticality : Integer default 1;

      // Associations
      toMaterial           : Association to MaterialMaster on toMaterial.MATNR = MATNR;
}

/**
 * Order Area Rules
 */
entity OARules {
  key DISTRIBUTION_CENTRE     : String(10);
  key ARTICLE_TYPE            : String(10);
  key ORDER_AREA_ID           : Integer;
      TRANSPORTATION_GROUP    : String(10);
      HIERARCHY_NODE_2        : String(20);
      HIERARCHY_NODE          : String(20);
      LAYOUT_MODULE           : String(50);
      DISTR_PROFILE           : String(20);
      BASE_UNIT_OF_MEASURE    : String(10);
      ROUNDING_PROFILE        : String(10);
      SHIPPING_INSTR          : String(10);
      STAGING_TIME_LOW        : Decimal(5,2);
      UNIT_OF_MEASURE_GRP     : String(10);
      FREEZE_THAW             : String(1);
      MIN_REM_SHELF_LIFE      : Integer;
      MIN_REM_SHELF_LIFE_2    : Integer;
      STAGING_TIME_HIGH       : Decimal(5,2);
      CREATED_AT_TIMESTAMP    : Timestamp;
      CHANGED_AT_TIMESTAMP    : Timestamp;
      USER_NAME               : String(40);
      DEACTIVATION            : String(1);
}

/**
 * Dashboard Analytics View - Aggregated metrics
 */
@UI.Chart: [{
  $Type: 'UI.ChartDefinitionType',
  ChartType: #Donut,
  Title: 'Overall Automation Rate',
  Measures: ['TotalProducts'],
  Dimensions: []
}]
@UI.DataPoint: {
  $Type: 'UI.DataPointType',
  Value: AutomationRate,
  Title: 'Automation Rate',
  TargetValue: 99,
  Visualization: #Progress
}
define view DashboardMetrics as
  select from MaterialOAMapping {
    key 1 as ID : Integer,
    COUNT(*) as AssignedProducts : Integer,
    0 as UnassignedProducts : Integer,
    0 as TotalProducts : Integer,
    0 as AutomationRate : Decimal(5,2)
  }
  union all
  select from UnassignedMaterials {
    key 2 as ID : Integer,
    0 as AssignedProducts : Integer,
    COUNT(*) as UnassignedProducts : Integer,
    0 as TotalProducts : Integer,
    0 as AutomationRate : Decimal(5,2)
  };

/**
 * Order Area Summary
 */
@UI.Chart: [{
  $Type: 'UI.ChartDefinitionType',
  ChartType: #Bar,
  Title: 'Products by Order Area',
  Measures: ['TotalProducts'],
  Dimensions: ['OA_DESCRIPTION'],
  MeasureAttributes: [{
    $Type: 'UI.ChartMeasureAttributeType',
    Measure: TotalProducts,
    Role: #Axis1
  }]
}]
@UI.LineItem: [
  {
    $Type: 'UI.DataField',
    Value: ORDER_AREA_ID,
    Label: 'Order Area ID'
  },
  {
    $Type: 'UI.DataField',
    Value: OA_DESCRIPTION,
    Label: 'Order Area'
  },
  {
    $Type: 'UI.DataField',
    Value: TotalProducts,
    Label: 'Total Products'
  }
]
define view OrderAreaSummary as select from MaterialOAMapping {
  key ORDER_AREA_ID,
  key OA_DESCRIPTION,
  COUNT(*) as TotalProducts : Integer
} group by ORDER_AREA_ID, OA_DESCRIPTION;

/**
 * Distribution Centre Summary
 */
define view DistributionCentreSummary as select from (
  select DISTRIBUTION_CENTRE, COUNT(*) as AssignedProducts from MaterialOAMapping group by DISTRIBUTION_CENTRE
) as assigned full join (
  select DISTRIBUTION_CENTRE, COUNT(*) as UnassignedProducts from UnassignedMaterials group by DISTRIBUTION_CENTRE
) as unassigned on assigned.DISTRIBUTION_CENTRE = unassigned.DISTRIBUTION_CENTRE {
  key COALESCE(assigned.DISTRIBUTION_CENTRE, unassigned.DISTRIBUTION_CENTRE) as DISTRIBUTION_CENTRE : String(10),
  (COALESCE(assigned.AssignedProducts, 0) + COALESCE(unassigned.UnassignedProducts, 0)) as TotalProducts : Integer,
  COALESCE(assigned.AssignedProducts, 0) as AssignedProducts : Integer,
  COALESCE(unassigned.UnassignedProducts, 0) as UnassignedProducts : Integer
};
