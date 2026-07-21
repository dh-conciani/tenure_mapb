// export land tenure for collection 11 (mapbiomas)

// Define a list of years to export

var years = [
    1985, 1986, 1987, 1988, 1989,
    1990, 1991, 1992, 1993, 1994,
    1995, 1996, 1997, 1998, 1999,
    2000, 2001, 2002, 2003, 2004,
    2005, 2006, 2007, 2008, 2009,
    2010, 2011, 2012, 2013, 2014,
    2015, 2016, 2017, 2018, 2019,
    2020, 2021, 2022, 2023, 2024,
    2025
]

// Asset mapbiomas
var asset = ee.ImageCollection('projects/mapbiomas-brazil/assets/LAND-COVER/COLLECTION-11/INTEGRATION/classification-ft') .filter(ee.Filter.eq('version', '0-4-13-w3y-5')).mosaic();

// Asset of regions for which you want to calculate statistics
var assetTerritories = "projects/mapbiomas-brazil/assets/ANCILLARY/IMAFLORA_MALHA_FUNDIARIA/br_malhafundiaria_2026";

// Numeric attribute to index the shapefiler
//var attribute = "CD_Bioma";

// Output csv name
var outputName = 'collection11-brazil-tenure';

// Change the scale if you need.
var scale = 30;

// Define a Google Drive output folder 
var driverFolder = 'Collection11';

/**
 * 
 */
// Territory
// remap for tenure (based in RAD)
var classIdIn =  [1,2,3,4,5,6,7,8,9,10,11,12,16,17,18,19,20,99,13,15,14,101,102,103,104,105,106,107,108,109,110,111,112,116,117,118,119,120,199,113,115,114];
var classIdOut = [1,2,3,4,5,6,7,8,9,10,11,12,12, 1, 1, 2, 8,99,13,15,14,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 12,  1,  1,  2,  8, 99,113, 15, 14];

var territory = ee.Image(assetTerritories)
  .remap({
    'from': classIdIn,
    'to': classIdOut
  });

Map.addLayer(territory)
// LULC remaped territory 

var mapbiomas = asset.selfMask();
print(mapbiomas)

// Image area in km2
var pixelArea = ee.Image.pixelArea().divide(10000);

// Geometry to export
var geometry = ee.Image(assetTerritories).geometry();

/**
 * Convert a complex ob to feature collection
 * @param obj 
 */
var convert2table = function (obj) {

    obj = ee.Dictionary(obj);

    var territory = obj.get('territory');

    var classesAndAreas = ee.List(obj.get('groups'));

    var tableRows = classesAndAreas.map(
        function (classAndArea) {
            classAndArea = ee.Dictionary(classAndArea);

            var classId = classAndArea.get('class');
            var area = classAndArea.get('sum');

            var tableColumns = ee.Feature(null)
                .set('territory', territory)
                .set('class', classId)
                .set('area', area);

            return tableColumns;
        }
    );

    return ee.FeatureCollection(ee.List(tableRows));
};

/**
 * Calculate area crossing a cover map (deforestation, mapbiomas)
 * and a region map (states, biomes, municipalites)
 * @param image 
 * @param territory 
 * @param geometry
 */
var calculateArea = function (image, territory, geometry) {

    var reducer = ee.Reducer.sum().group(1, 'class').group(1, 'territory');

    var territotiesData = pixelArea.addBands(territory).addBands(image)
        .reduceRegion({
            reducer: reducer,
            geometry: geometry,
            scale: scale,
            maxPixels: 1e13
        });

    territotiesData = ee.List(territotiesData.get('groups'));

    var areas = territotiesData.map(convert2table);

    areas = ee.FeatureCollection(areas).flatten();

    return areas;
};

var areas = years.map(
    function (year) {
        var image = mapbiomas.select('classification_' + year);

        var areas = calculateArea(image, territory, geometry);

        // set additional properties
        areas = areas.map(
            function (feature) {
                return feature.set('year', year);
            }
        );

        return areas;
    }
);

areas = ee.FeatureCollection(areas).flatten();

Export.table.toDrive({
    collection: areas,
    description: outputName,
    folder: driverFolder,
    fileNamePrefix: outputName,
    fileFormat: 'CSV'
});
