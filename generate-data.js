// Generate sample data for OA Assignment Monitor
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Order Area definitions
const ORDER_AREAS = {
  190: { name: 'Ambient', description: 'Dry goods, shelf-stable', temp: 'Room temperature' },
  191: { name: 'Freezer', description: 'Frozen goods', temp: '-18°C' },
  192: { name: 'Chiller', description: 'Refrigerated', temp: '2-6°C' },
  193: { name: 'Fresh Meat', description: 'Meat & poultry', temp: '0-4°C' },
  194: { name: 'Produce', description: 'Fruit & vegetables', temp: '8-12°C' },
  195: { name: 'Bakery', description: 'Bread & pastries', temp: 'Room temperature' }
};

// Product categories by OA
const PRODUCTS = {
  190: [ // Ambient
    'Organic Pasta 500g', 'Olive Oil Extra Virgin 750ml', 'Canned Tomatoes 400g',
    'Rice Basmati 1kg', 'Cereal Cornflakes 500g', 'Coffee Beans 250g',
    'Tea Bags English Breakfast 80ct', 'Sugar White 1kg', 'Flour Plain 1.5kg',
    'Biscuits Chocolate Chip 300g', 'Jam Strawberry 340g', 'Honey Pure 500g',
    'Peanut Butter Smooth 340g', 'Canned Tuna 185g', 'Soup Tomato 400g',
    'Spaghetti Sauce 500g', 'Chips Salt & Vinegar 150g', 'Crackers Wheat 250g',
    'Dried Apricots 200g', 'Nuts Mixed 300g', 'Chocolate Bar Dark 100g',
    'Energy Drink 250ml', 'Juice Apple 1L', 'Water Sparkling 1L',
    'Vinegar Balsamic 250ml', 'Salt Sea 500g', 'Pepper Black Ground 100g',
    'Stock Cubes Chicken 10pk', 'Noodles Instant 85g', 'Coconut Milk 400ml'
  ],
  191: [ // Freezer
    'Frozen Pizza Margherita 400g', 'Ice Cream Vanilla 1L', 'Frozen Peas 1kg',
    'Frozen Prawns 500g', 'Fish Fingers 450g', 'Frozen Berries Mixed 500g',
    'Frozen Chicken Nuggets 600g', 'Frozen French Fries 1kg', 'Ice Lollies 6pk',
    'Frozen Spinach 450g', 'Frozen Broccoli 500g', 'Frozen Corn 500g',
    'Frozen Green Beans 500g', 'Frozen Mixed Veg 1kg', 'Frozen Mango Chunks 500g',
    'Frozen Fish Fillets 400g', 'Frozen Seafood Mix 500g', 'Frozen Garlic Bread 2pk',
    'Frozen Onion Rings 450g', 'Frozen Spring Rolls 400g', 'Ice Cream Chocolate 1L',
    'Frozen Yorkshire Puddings 12pk', 'Frozen Hash Browns 750g', 'Frozen Waffles 8pk',
    'Frozen Beef Burgers 8pk', 'Frozen Sausages 454g', 'Frozen Pastry Sheets 500g',
    'Frozen Apple Pie 400g', 'Frozen Cheesecake 500g', 'Frozen Lasagna 400g'
  ],
  192: [ // Chiller
    'Fresh Milk Whole 2L', 'Fresh Milk Semi-Skimmed 1L', 'Yogurt Greek 500g',
    'Cheese Cheddar 200g', 'Butter Unsalted 250g', 'Eggs Free Range 12pk',
    'Fresh Orange Juice 1L', 'Cream Double 300ml', 'Sour Cream 200ml',
    'Cream Cheese 200g', 'Mozzarella 125g', 'Parmesan Grated 100g',
    'Yogurt Natural 1kg', 'Cottage Cheese 300g', 'Fresh Pasta 250g',
    'Pizza Base Fresh 2pk', 'Hummus 200g', 'Coleslaw 300g',
    'Salad Caesar 200g', 'Dip Sour Cream & Chive 200g', 'Butter Salted 250g',
    'Milk Almond 1L', 'Milk Oat 1L', 'Kefir 500ml',
    'Cheese Mozzarella Balls 200g', 'Cheese Brie 200g', 'Cheese Goat 150g',
    'Fresh Tortellini 250g', 'Fresh Ravioli 300g', 'Guacamole 170g'
  ],
  193: [ // Fresh Meat
    'Chicken Breast Skinless 500g', 'Beef Mince 500g', 'Pork Chops 400g',
    'Lamb Chops 500g', 'Chicken Thighs 600g', 'Beef Steak Sirloin 250g',
    'Sausages Pork 454g', 'Bacon Smoked 250g', 'Turkey Breast Sliced 200g',
    'Beef Steak Ribeye 300g', 'Pork Mince 500g', 'Lamb Mince 500g',
    'Chicken Wings 1kg', 'Beef Roast 1kg', 'Pork Belly 500g',
    'Chicken Drumsticks 750g', 'Duck Breast 400g', 'Venison Steak 250g',
    'Beef Stewing 500g', 'Pork Shoulder 750g', 'Lamb Shoulder 800g',
    'Chicken Whole 1.5kg', 'Turkey Mince 500g', 'Beef Short Ribs 600g',
    'Pork Ribs 800g', 'Lamb Leg 1.2kg', 'Chicken Liver 300g',
    'Beef Burgers Premium 4pk', 'Sausages Cumberland 400g', 'Ham Sliced 150g'
  ],
  194: [ // Produce
    'Apples Royal Gala 1kg', 'Bananas 1kg', 'Oranges 1kg', 'Tomatoes 500g',
    'Lettuce Iceberg 1pc', 'Carrots 1kg', 'Potatoes 2kg', 'Onions Brown 1kg',
    'Broccoli 500g', 'Cucumber 1pc', 'Peppers Red 3pk', 'Mushrooms 250g',
    'Grapes Seedless 500g', 'Strawberries 400g', 'Blueberries 250g',
    'Avocado Ready to Eat 2pk', 'Spinach Baby 200g', 'Kale 200g',
    'Cauliflower 1pc', 'Courgette 500g', 'Aubergine 1pc', 'Lemons 4pk',
    'Limes 5pk', 'Garlic Bulbs 3pk', 'Ginger Root 100g', 'Spring Onions 1bunch',
    'Cherry Tomatoes 250g', 'Sweet Potato 750g', 'Butternut Squash 1pc',
    'Rocket Salad 80g', 'Parsley Fresh 30g', 'Coriander Fresh 30g'
  ],
  195: [ // Bakery
    'Bread White Sliced 800g', 'Bread Wholemeal 750g', 'Bread Sourdough 500g',
    'Bread Baguette 250g', 'Rolls White 6pk', 'Rolls Wholemeal 6pk',
    'Croissants 4pk', 'Pain au Chocolat 4pk', 'Muffins Blueberry 4pk',
    'Bagels Plain 5pk', 'Bread Ciabatta 250g', 'Bread Pitta 6pk',
    'Bread Naan 2pk', 'Bread Rye 500g', 'Bread Seeded 750g',
    'Danish Pastry 4pk', 'Doughnuts Ring 5pk', 'Scones Plain 4pk',
    'Bread Focaccia 300g', 'Bread Tiger 400g', 'Wraps Tortilla 8pk',
    'Crumpets 6pk', 'Teacakes 6pk', 'Hot Cross Buns 4pk',
    'Bread Brioche 400g', 'Bread Challah 500g', 'Bread Pumpernickel 500g',
    'Cookies Chocolate Chip 200g', 'Brownies 4pk', 'Carrot Cake Slice 120g'
  ]
};

// Distribution centers
const DISTRIBUTION_CENTRES = ['DC10', 'DC20', 'BD01', 'BD03', 'BD05', 'WH01', 'WH02'];

// Article types
const ARTICLE_TYPES = ['FERT', 'HALB', 'Z100', 'Z200', 'Z300', 'Z400'];

// Users
const USERS = ['199CHMEL', '199KESSER', '199BASAVANNA', '199MUELLER', '199SMITH', '199ZOLFAGHAR', '199JONES'];

// Helper functions
function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatTimestamp(date) {
  return date.toISOString().replace('T', ' ').replace('Z', '0000');
}

function generateMaterialMaster(count = 300) {
  const data = [];
  data.push('MANDT,MATNR,ERSDA,CREATED_AT_TIME,ERNAM,LAEDA,AENAM,VPSTA,PSTAT,LVORM,MTART,MBRSH,MATKL,BISMT,MEINS,BSTME,PRODUCT_DESCRIPTION');

  let matIndex = 1;

  // Generate materials for each OA category
  Object.keys(ORDER_AREAS).forEach(oaId => {
    const products = PRODUCTS[oaId];
    const productsPerOA = Math.floor(count / Object.keys(ORDER_AREAS).length);

    for (let i = 0; i < productsPerOA && matIndex <= count; i++) {
      const matnr = `MAT${String(matIndex).padStart(5, '0')}`;
      const productDesc = products[i % products.length];
      const ersda = randomDate(new Date('2023-01-01'), new Date('2025-12-31'));
      const laeda = randomDate(ersda, new Date('2026-11-02'));
      const createdTime = `${String(ersda.getHours()).padStart(2, '0')}:${String(ersda.getMinutes()).padStart(2, '0')}:${String(ersda.getSeconds()).padStart(2, '0')}`;

      data.push([
        '001',
        matnr,
        ersda.toISOString().split('T')[0],
        createdTime,
        randomElement(USERS),
        laeda.toISOString().split('T')[0],
        randomElement(USERS),
        randomElement(['K', 'VK', 'BK']),
        randomElement(['K', 'VK', 'BK']),
        Math.random() > 0.9 ? 'X' : '',
        randomElement(['CBAU', 'DIEN', 'LEER', 'FERT', 'HALB', 'ROH', 'VERP', 'NLAG']),
        randomElement(['M', 'A', 'C', 'E', 'H', 'W']),
        String(Math.floor(Math.random() * 50) + 1).padStart(3, '0'),
        Math.random() > 0.7 ? `OLD-${matnr}` : '',
        randomElement(['PAL', 'KAR', 'TO', 'PC', 'BOX', 'H', 'ST', 'KG', 'L', 'M']),
        randomElement(['TO', 'PC', 'BOX', 'H', 'ST', 'KG', 'L', 'M', 'PAL', 'KAR']),
        productDesc
      ].join(','));

      matIndex++;
    }
  });

  return data.join('\n');
}

function generateMaterialOAMapping(count = 300) {
  const data = [];
  data.push('MANDT,MATNR,ORDER_AREA_ID,ASSIGNMENT_STATUS,DISTRIBUTION_CENTRE,ARTICLE_TYPE,ASSIGNED_BY,ASSIGNED_AT,LAST_CHANGED_AT,OA_DESCRIPTION');

  for (let i = 1; i <= count; i++) {
    const matnr = `MAT${String(i).padStart(5, '0')}`;
    const oaId = randomElement(Object.keys(ORDER_AREAS));
    const oaDescription = ORDER_AREAS[oaId].name;
    const isAssigned = Math.random() > 0.09; // 91% assigned
    const assignedAt = isAssigned ? randomDate(new Date('2026-01-01'), new Date('2026-11-01')) : null;
    const lastChanged = randomDate(new Date('2026-11-01'), new Date('2026-11-02'));

    data.push([
      '001',
      matnr,
      oaId,
      isAssigned ? 'ASSIGNED' : 'UNASSIGNED',
      randomElement(DISTRIBUTION_CENTRES),
      randomElement(ARTICLE_TYPES),
      isAssigned ? randomElement(USERS) : '',
      isAssigned ? formatTimestamp(assignedAt) : '',
      formatTimestamp(lastChanged),
      oaDescription
    ].join(','));
  }

  return data.join('\n');
}

function generateOARules(count = 300) {
  const data = [];
  data.push('DISTRIBUTION_CENTRE,ARTICLE_TYPE,TRANSPORTATION_GROUP,HIERARCHY_NODE_2,HIERARCHY_NODE,LAYOUT_MODULE,DISTR_PROFILE,BASE_UNIT_OF_MEASURE,ROUNDING_PROFILE,SHIPPING_INSTR,STAGING_TIME_LOW,UNIT_OF_MEASURE_GRP,FREEZE_THAW,MIN_REM_SHELF_LIFE,MIN_REM_SHELF_LIFE_2,STAGING_TIME_HIGH,ORDER_AREA_ID,CREATED_AT_TIMESTAMP,CHANGED_AT_TIMESTAMP,USER_NAME,DEACTIVATION');

  // Generate unique rules for each OA and DC/Article Type combination
  const oaIds = Object.keys(ORDER_AREAS);
  const seenKeys = new Set();
  let ruleIndex = 0;

  while (ruleIndex < count) {
    const dc = randomElement(DISTRIBUTION_CENTRES);
    const articleType = randomElement(ARTICLE_TYPES);
    const oaId = randomElement(oaIds);

    // Create unique key
    const key = `${dc}|${articleType}|${oaId}`;

    // Skip if already exists
    if (seenKeys.has(key)) {
      continue;
    }
    seenKeys.add(key);

    const createdAt = randomDate(new Date('2024-09-01'), new Date('2026-10-01'));
    const changedAt = randomDate(createdAt, new Date('2026-11-02'));

    data.push([
      dc,
      articleType,
      `000${Math.floor(Math.random() * 5) + 1}`,
      `000${Math.floor(Math.random() * 5) + 1}`,
      `0002560${Math.floor(Math.random() * 5) + 2}`,
      Math.random() > 0.7 ? `ADE-${String(Math.floor(Math.random() * 100)).padStart(3, '0')}*` : '',
      Math.random() > 0.5 ? randomElement(['DDP', 'EUP', 'CAR']) : '',
      Math.random() > 0.5 ? randomElement(['KG', 'PC', 'PAL', 'TO']) : '',
      '',
      Math.random() > 0.7 ? randomElement(['Z3', 'Z4']) : '',
      Math.random() > 0.5 ? (Math.random() * 5).toFixed(2) : '',
      '',
      Math.random() > 0.8 ? 'X' : '',
      Math.random() > 0.5 ? Math.floor(Math.random() * 365) : '',
      Math.random() > 0.5 ? Math.floor(Math.random() * 180) : '',
      Math.random() > 0.5 ? (Math.random() * 10).toFixed(2) : '',
      oaId,
      formatTimestamp(createdAt),
      formatTimestamp(changedAt),
      randomElement(USERS),
      ''
    ].join(','));

    ruleIndex++;
  }

  return data.join('\n');
}

// Generate and save files
const dataDir = path.join(__dirname, 'db', 'data');

console.log('Generating 300 records for each table...\n');

const materialMaster = generateMaterialMaster(300);
fs.writeFileSync(path.join(dataDir, 'aldi.oa-MaterialMaster.csv'), materialMaster);
console.log('✓ Generated MATERIAL_MASTER.csv with 300 records');

const materialOAMapping = generateMaterialOAMapping(300);
fs.writeFileSync(path.join(dataDir, 'aldi.oa-MaterialOAMapping.csv'), materialOAMapping);
console.log('✓ Generated MATERIAL_OA_MAPPING.csv with 300 records');

const oaRules = generateOARules(200); // Reduced to 200 to avoid timeout
fs.writeFileSync(path.join(dataDir, 'aldi.oa-OARules.csv'), oaRules);
console.log('✓ Generated OA_RULES.csv with 200 records');

console.log('\nData generation complete!');
console.log('\nOrder Area Mapping:');
Object.keys(ORDER_AREAS).forEach(id => {
  console.log(`  ${id} = ${ORDER_AREAS[id].name} (${ORDER_AREAS[id].description})`);
});
