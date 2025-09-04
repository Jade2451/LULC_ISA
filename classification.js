// Land Use Land Cover (LULC) Classification of Kolkata, India
// This script uses Sentinel-2 imagery and a Random Forest classifier in Google Earth Engine.
// By Biswajit Dey, NIT Rourkela.

// ==========================================================================================
// STEP 1: DEFINE AREA OF INTEREST (AOI)
// ==========================================================================================
// Define the geographic boundaries for the Kolkata study area.
var aoi = ee.Geometry.Rectangle([88.20, 22.45, 88.50, 22.70]);

// Center the map view on the AOI.
Map.centerObject(aoi, 11);

// ==========================================================================================
// STEP 2: LOAD AND PREPROCESS SENTINEL-2 IMAGERY
// ==========================================================================================
// Define the date range for the satellite imagery.
var startDate = '2024-01-01';
var endDate = '2024-03-31';

// Function to mask clouds using the Sentinel-2 QA band.
function maskS2clouds(image) {
  var qa = image.select('QA60');
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  return image.updateMask(mask).divide(10000);
}

// Load Sentinel-2 imagery, filter it, and create a cloud-free composite.
var s2 = ee.ImageCollection('COPERNICUS/S2_SR')
    .filterBounds(aoi)
    .filterDate(startDate, endDate)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10))
    .map(maskS2clouds)
    .median()
    .clip(aoi);

// Define visualization parameters for a true-color composite.
var rgbVisParams = {
  bands: ['B4', 'B3', 'B2'],
  min: 0.0,
  max: 0.3,
};

// Add the true-color image to the map.
Map.addLayer(s2, rgbVisParams, 'Sentinel-2 True Color');

// ==========================================================================================
// STEP 3: FEATURE ENGINEERING - CALCULATE SPECTRAL INDICES
// ==========================================================================================
// Calculate Normalized Difference Vegetation Index (NDVI).
var ndvi = s2.normalizedDifference(['B8', 'B4']).rename('NDVI');

// Calculate Normalized Difference Water Index (NDWI).
var ndwi = s2.normalizedDifference(['B3', 'B8']).rename('NDWI');

// Add the new index bands to the original image.
var imageWithIndices = s2.addBands([ndvi, ndwi]);

// Define the bands to be used for classification.
var bands = ['B2', 'B3', 'B4', 'B8', 'NDVI', 'NDWI'];

// ==========================================================================================
// STEP 4: CREATE TRAINING DATA
// ==========================================================================================
// IMPORTANT USER ACTION:
// You must manually create training polygons before running the script.
// 1. In the GEE editor, use the geometry drawing tools on the left.
// 2. Create a new layer for each class by clicking "+ new layer".
// 3. Rename the layers exactly as follows: water, vegetation, builtup, barren.
// 4. Digitize at least 5-10 polygons for each class across the AOI. The more accurately you map these to the regions the better. I would suggest you zoom in for this step. 
// 5. The script will automatically use these layers.

// Merge the manually drawn geometries into a single FeatureCollection.
// The 'class' property is assigned a numeric code for each land cover type.
var trainingPolygons = water.map(function(f) { return f.set('class', 0); })
  .merge(vegetation.map(function(f) { return f.set('class', 1); }))
  .merge(builtup.map(function(f) { return f.set('class', 2); }))
  .merge(barren.map(function(f) { return f.set('class', 3); }));

// Generate training samples by sampling the image at the locations of the polygons.
var trainingData = imageWithIndices.select(bands).sampleRegions({
  collection: trainingPolygons,
  properties: ['class'],
  scale: 10
});

// ==========================================================================================
// STEP 5: TRAIN THE CLASSIFIER
// ==========================================================================================
// Split the data into training (70%) and testing (30%) sets.
var withRandom = trainingData.randomColumn('random');
var split = 0.7;
var trainingSet = withRandom.filter(ee.Filter.lt('random', split));
var testingSet = withRandom.filter(ee.Filter.gte('random', split));

// Initialize a Random Forest classifier.
var classifier = ee.Classifier.smileRandomForest(100).train({
  features: trainingSet,
  classProperty: 'class',
  inputProperties: bands
});

// ==========================================================================================
// STEP 6: CLASSIFY THE IMAGE
// ==========================================================================================
// Apply the trained classifier to the entire image.
var classified = imageWithIndices.select(bands).classify(classifier);

// Define a color palette for the LULC map.
var lulcPalette = [
  '#0000FF', // Water (Blue)
  '#008000', // Vegetation (Green)
  '#808080', // Built-up (Gray)
  '#A52A2A', // Barren Land (Brown)
];

// Add the classified LULC map to the map view.
Map.addLayer(classified, {min: 0, max: 3, palette: lulcPalette}, 'Kolkata LULC Map');

// ==========================================================================================
// STEP 7: ACCURACY ASSESSMENT
// ==========================================================================================
// Classify the testing data to get a confusion matrix.
var confusionMatrix = testingSet.classify(classifier)
  .errorMatrix('class', 'classification');

// Print the accuracy metrics to the console.
print('----------------------------------------');
print('ACCURACY ASSESSMENT');
print('Confusion Matrix:', confusionMatrix);
print('Overall Accuracy:', confusionMatrix.accuracy());
print('Kappa Coefficient:', confusionMatrix.kappa());
print('----------------------------------------');

// ==========================================================================================
// STEP 8: CALCULATE AREA OF EACH CLASS
// ==========================================================================================
// Calculate the area of each LULC class in square kilometers.
var areaImage = ee.Image.pixelArea().addBands(classified);
var area = areaImage.reduceRegion({
  reducer: ee.Reducer.sum().group({
    groupField: 1,
    groupName: 'class',
  }),
  geometry: aoi,
  scale: 10,
  maxPixels: 1e13
});

var classAreas = ee.List(area.get('groups'));
var classAreaList = classAreas.map(function(item) {
  var areaDict = ee.Dictionary(item);
  var classId = areaDict.get('class');
  var areaSqMeters = areaDict.get('sum');
  var areaSqKm = ee.Number(areaSqMeters).divide(1e6);
  return ee.Feature(null, {'class': classId, 'area_sq_km': areaSqKm});
});

// Print area statistics to the console.
print('AREA STATISTICS (sq. km)');
print(ee.FeatureCollection(classAreaList));
print('----------------------------------------');

// ==========================================================================================
// STEP 9: EXPORT THE MAP -> if you want to export this to your drive directly
// ==========================================================================================
// Export.image.toDrive({
//   image: classified.toByte(),
//   description: 'Kolkata_LULC_Map_2024',
//   folder: 'GEE_Exports',
//   scale: 10,
//   region: aoi,
  maxPixels: 1e13
});

