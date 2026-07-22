// ============================================================
// MALHA FUNDIÁRIA 2026
// FOUR LEVEL_0 MAPS + FOUR THUMBNAILS
// BRAZILIAN BIOME BOUNDARIES
// ============================================================


// ============================================================
// 1. INPUT RASTER
// ============================================================

var assetId =
  'projects/mapbiomas-brazil/assets/ANCILLARY/' +
  'IMAFLORA_MALHA_FUNDIARIA/br_malhafundiaria_2026';

var tenure = ee.Image(assetId).select([0]);

print('Input raster:', tenure);


// ============================================================
// 2. HIERARCHY CONFIGURATION
// ============================================================

var mapConfigs = [

  // ----------------------------------------------------------
  // MAP 1
  // ÁREAS PROTEGIDAS OU DE USO COLETIVO
  // ----------------------------------------------------------
  {
    title: 'Áreas Protegidas ou de Uso Coletivo',

    sourceIds: [
      // Terra Indígena
      1, 2, 101, 102, 117, 118, 119,

      // Território Quilombola
      6, 7, 106, 107,

      // Unidade de Conservação
      11, 12, 16, 17, 18, 19, 20, 99,
      111, 112, 116, 120, 199
    ],

    classIds: [
      1, 1, 1, 1, 1, 1, 1,
      2, 2, 2, 2,
      3, 3, 3, 3, 3, 3, 3, 3,
      3, 3, 3, 3, 3
    ],

    labels: [
      'Terra Indígena',
      'Território Quilombola',
      'Unidade de Conservação'
    ],

    palette: [
      'CCEE66',
      '78185C',
      'A7C957'
    ]
  },

  // ----------------------------------------------------------
  // MAP 2
  // TERRAS PÚBLICAS OU SEM REGISTRO SEM CAR
  // ----------------------------------------------------------
  {
    title:
      'Terras Públicas ou Sem Registro Fundiário Georreferenciado',

    sourceIds: [
      // Área Militar
      3, 103,

      // Gleba Pública
      4, 5, 104, 105,

      // Sem registro sem CAR
      13
    ],

    classIds: [
      1, 1,
      2, 2, 2, 2,
      3
    ],

    labels: [
      'Área Militar',
      'Gleba Pública',
      'Sem Registro Fundiário Georreferenciado sem CAR'
    ],

    palette: [
      '474747',
      'CC5803',
      '335C67'
    ]
  },

  // ----------------------------------------------------------
  // MAP 3
  // ÁREAS PRIVADAS COM REGISTRO
  // ----------------------------------------------------------
  {
    title:
      'Áreas Privadas com Registro Fundiário Georreferenciado',

    sourceIds: [
      // Imóvel Rural Privado
      8, 108,

      // Assentamento
      9, 10, 109, 110,

      // Áreas Urbanas
      14, 114
    ],

    classIds: [
      1, 1,
      2, 2, 2, 2,
      3, 3
    ],

    labels: [
      'Imóvel Rural Privado',
      'Assentamento',
      'Áreas Urbanas'
    ],

    palette: [
      'FFE1A8',
      '9C3848',
      '472D30'
    ]
  },

  // ----------------------------------------------------------
  // MAP 4
  // SEM REGISTRO COM CAR
  // ----------------------------------------------------------
  {
    title:
      'Sem Registro Fundiário Georreferenciado com CAR',

    sourceIds: [
      113
    ],

    classIds: [
      1
    ],

    labels: [
      'Sem Registro Fundiário Georreferenciado com CAR'
    ],

    palette: [
      'E79F0D'
    ]
  }
];


// ============================================================
// 3. REMAP FUNCTION
// ============================================================

function createLevel1Image(config) {
  return tenure
    .remap(config.sourceIds, config.classIds)
    .rename('level_1')
    .toByte();
}


// ============================================================
// 4. INTERACTIVE MAP LEGEND
// ============================================================

function makeLegendRow(color, label) {

  var colorBox = ui.Label({
    value: '',
    style: {
      backgroundColor: '#' + color,
      padding: '8px',
      margin: '0 6px 4px 0'
    }
  });

  var description = ui.Label({
    value: label,
    style: {
      fontSize: '11px',
      whiteSpace: 'normal',
      margin: '0 0 4px 0'
    }
  });

  return ui.Panel({
    widgets: [
      colorBox,
      description
    ],
    layout: ui.Panel.Layout.Flow('horizontal')
  });
}


function makeLegend(config) {

  var legend = ui.Panel({
    style: {
      position: 'bottom-left',
      padding: '8px 10px',
      width: '290px',
      backgroundColor: 'rgba(255,255,255,0.90)'
    }
  });

  legend.add(ui.Label({
    value: 'Legenda — level_1',
    style: {
      fontWeight: 'bold',
      fontSize: '13px',
      margin: '0 0 6px 0'
    }
  }));

  for (var i = 0; i < config.labels.length; i++) {
    legend.add(
      makeLegendRow(
        config.palette[i],
        config.labels[i]
      )
    );
  }

  return legend;
}


// ============================================================
// 5. CREATE INTERACTIVE MAP
// ============================================================

function createMap(config) {

  var map = ui.Map();

  var classified = createLevel1Image(config);

  map.addLayer(
    classified,
    {
      min: 1,
      max: config.labels.length,
      palette: config.palette
    },
    config.title,
    true,
    1
  );

  map.add(ui.Label({
    value: config.title,
    style: {
      position: 'top-center',
      fontSize: '14px',
      fontWeight: 'bold',
      padding: '6px 10px',
      backgroundColor: 'rgba(255,255,255,0.88)'
    }
  }));

  map.add(makeLegend(config));

  map.setOptions('HYBRID');
  map.setCenter(-52.5, -14.5, 4);

  return {
    map: map,
    image: classified
  };
}


// ============================================================
// 6. CREATE FOUR INTERACTIVE MAPS
// ============================================================

var protectedResult = createMap(mapConfigs[0]);
var publicResult = createMap(mapConfigs[1]);
var privateResult = createMap(mapConfigs[2]);
var noRegistryCarResult = createMap(mapConfigs[3]);

var protectedMap = protectedResult.map;
var publicMap = publicResult.map;
var privateMap = privateResult.map;
var noRegistryCarMap = noRegistryCarResult.map;


// Synchronize maps.
var linker = ui.Map.Linker([
  protectedMap,
  publicMap,
  privateMap,
  noRegistryCarMap
]);


// ============================================================
// 7. CREATE 2 × 2 INTERACTIVE MAP GRID
// ============================================================

var topRow = ui.Panel({
  widgets: [
    protectedMap,
    publicMap
  ],
  layout: ui.Panel.Layout.Flow('horizontal'),
  style: {
    stretch: 'both'
  }
});


var bottomRow = ui.Panel({
  widgets: [
    privateMap,
    noRegistryCarMap
  ],
  layout: ui.Panel.Layout.Flow('horizontal'),
  style: {
    stretch: 'both'
  }
});


var mapGrid = ui.Panel({
  widgets: [
    topRow,
    bottomRow
  ],
  layout: ui.Panel.Layout.Flow('vertical'),
  style: {
    stretch: 'both'
  }
});


ui.root.widgets().reset([
  mapGrid
]);


// ============================================================
// 8. VALIDATION
// ============================================================

print(
  'Protected areas:',
  protectedResult.image
);

print(
  'Public lands / no registry without CAR:',
  publicResult.image
);

print(
  'Private registered areas:',
  privateResult.image
);

print(
  'No registry with CAR — ID 113:',
  noRegistryCarResult.image
);


// ============================================================
// 9. THUMBNAIL INPUTS
// ============================================================

// Brazil boundary.
var brazil = ee.FeatureCollection(
  'projects/mapbiomas-workspace/AUXILIAR/brasil_2km'
);

// Brazilian biomes.
var biomes = ee.FeatureCollection(
  'projects/mapbiomas-workspace/AUXILIAR/' +
  'bioma_2025_e250k_5kbuffer'
);

// Rectangular region used by all thumbnails.
var thumbnailRegion = brazil
  .geometry()
  .bounds();

print('Brazilian biomes:', biomes);


// ============================================================
// 10. THUMBNAIL BASE IMAGES
// ============================================================

// White background.
var whiteBackground = ee.Image.constant(1)
  .clip(thumbnailRegion)
  .visualize({
    min: 0,
    max: 1,
    palette: ['FFFFFF']
  });


// Biome boundary lines.
var biomeLines = ee.Image()
  .byte()
  .paint({
    featureCollection: biomes,
    color: 1,
    width: 2
  })
  .clipToCollection(brazil)
  .selfMask()
  .visualize({
    palette: ['555555']
  });


// Brazil external boundary.
var brazilLine = ee.Image()
  .byte()
  .paint({
    featureCollection: brazil,
    color: 1,
    width: 3
  })
  .selfMask()
  .visualize({
    palette: ['222222']
  });


// ============================================================
// 11. THUMBNAIL LEGEND ROW
// ============================================================

function createThumbnailLegendRow(color, label) {

  var colorBox = ui.Label({
    value: '',
    style: {
      backgroundColor: '#' + color,
      padding: '8px',
      margin: '0 7px 4px 0'
    }
  });

  var labelWidget = ui.Label({
    value: label,
    style: {
      fontSize: '11px',
      whiteSpace: 'normal',
      margin: '0 0 4px 0'
    }
  });

  return ui.Panel({
    widgets: [
      colorBox,
      labelWidget
    ],
    layout: ui.Panel.Layout.Flow('horizontal')
  });
}


// ============================================================
// 12. CREATE ONE THUMBNAIL
// ============================================================

function createThumbnailCard(config) {

  var classified = createLevel1Image(config);

  var classVisualization = classified.visualize({
    min: 1,
    max: config.labels.length,
    palette: config.palette,
    opacity: 1
  });

  var composite = whiteBackground
    .blend(classVisualization)
    .blend(biomeLines)
    .blend(brazilLine)
    .clip(thumbnailRegion);

  var thumbnail = ui.Thumbnail({
    image: composite,

    params: {
      region: thumbnailRegion,
      dimensions: '600x600',
      format: 'png',
      crs: 'EPSG:3857'
    },

    style: {
      width: '500px',
      height: '500px',
      margin: '4px',
      border: '1px solid C8C8C8'
    }
  });

  var title = ui.Label({
    value: config.title,

    style: {
      width: '500px',
      fontSize: '14px',
      fontWeight: 'bold',
      textAlign: 'center',
      whiteSpace: 'normal',
      margin: '8px 4px 6px 4px'
    }
  });

  var legend = ui.Panel({
    layout: ui.Panel.Layout.Flow('vertical'),

    style: {
      width: '500px',
      padding: '6px 8px 10px 8px'
    }
  });

  legend.add(ui.Label({
    value: 'Legenda',

    style: {
      fontSize: '12px',
      fontWeight: 'bold',
      margin: '0 0 6px 0'
    }
  }));

  for (var i = 0; i < config.labels.length; i++) {
    legend.add(
      createThumbnailLegendRow(
        config.palette[i],
        config.labels[i]
      )
    );
  }

  var card = ui.Panel({
    widgets: [
      title,
      thumbnail,
      legend
    ],

    layout: ui.Panel.Layout.Flow('vertical'),

    style: {
      width: '520px',
      padding: '4px',
      margin: '6px',
      border: '1px solid D0D0D0',
      backgroundColor: 'FFFFFF'
    }
  });

  return {
    image: composite,
    card: card
  };
}


// ============================================================
// 13. CREATE FOUR THUMBNAILS
// ============================================================

var thumbnail1 = createThumbnailCard(mapConfigs[0]);
var thumbnail2 = createThumbnailCard(mapConfigs[1]);
var thumbnail3 = createThumbnailCard(mapConfigs[2]);
var thumbnail4 = createThumbnailCard(mapConfigs[3]);


// ============================================================
// 14. CREATE THUMBNAIL GALLERY
// ============================================================

var thumbnailTopRow = ui.Panel({
  widgets: [
    thumbnail1.card,
    thumbnail2.card
  ],
  layout: ui.Panel.Layout.Flow('horizontal')
});


var thumbnailBottomRow = ui.Panel({
  widgets: [
    thumbnail3.card,
    thumbnail4.card
  ],
  layout: ui.Panel.Layout.Flow('horizontal')
});


var thumbnailGallery = ui.Panel({
  widgets: [
    ui.Label({
      value: 'Malha Fundiária 2026',
      style: {
        fontSize: '20px',
        fontWeight: 'bold',
        margin: '10px'
      }
    }),

    thumbnailTopRow,
    thumbnailBottomRow
  ],

  layout: ui.Panel.Layout.Flow('vertical'),

  style: {
    padding: '8px',
    backgroundColor: 'F5F5F5'
  }
});


print(
  'Galeria de thumbnails',
  thumbnailGallery
);


// ============================================================
// 15. PNG URLS
// ============================================================

print(
  'PNG — Áreas Protegidas',
  thumbnail1.image.getThumbURL({
    region: thumbnailRegion,
    dimensions: '1600x1600',
    format: 'png',
    crs: 'EPSG:3857'
  })
);


print(
  'PNG — Terras Públicas',
  thumbnail2.image.getThumbURL({
    region: thumbnailRegion,
    dimensions: '1600x1600',
    format: 'png',
    crs: 'EPSG:3857'
  })
);


print(
  'PNG — Áreas Privadas',
  thumbnail3.image.getThumbURL({
    region: thumbnailRegion,
    dimensions: '1600x1600',
    format: 'png',
    crs: 'EPSG:3857'
  })
);


print(
  'PNG — Sem Registro com CAR',
  thumbnail4.image.getThumbURL({
    region: thumbnailRegion,
    dimensions: '1600x1600',
    format: 'png',
    crs: 'EPSG:3857'
  })
);
