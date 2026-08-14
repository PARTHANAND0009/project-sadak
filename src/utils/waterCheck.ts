export interface WaterCheckResult {
  isWater: boolean;
  waterName?: string;
  roadName?: string;
  reason?: string;
}

// In-memory cache to avoid repeated network calls for the same coordinates
const checkCache = new Map<string, WaterCheckResult>();

const WATER_TYPES = new Set([
  'water',
  'waterway',
  'river',
  'riverbank',
  'stream',
  'canal',
  'drain',
  'ditch',
  'brook',
  'lake',
  'pond',
  'reservoir',
  'basin',
  'dock',
  'harbour',
  'marina',
  'sea',
  'ocean',
  'bay',
  'gulf',
  'strait',
  'cove',
  'lagoon',
  'swamp',
  'marsh',
  'wetland',
  'swimming_pool',
  'water_point',
  'shoal',
  'reef',
  'coastline',
  'beach',
  'jheel',
  'jhil',
  'talab',
  'sarovar',
  'kund',
  'dam',
  'weir'
]);

const WATER_KEYWORDS = [
  'jheel',
  'jhil',
  'lake',
  'talab',
  'talav',
  'sarovar',
  'sagar',
  'kund',
  'pokhar',
  'cheruvu',
  'kulam',
  'eri',
  'wetland',
  'marsh',
  'swamp',
  'bog',
  'fen',
  'mangrove',
  'drain',
  'nullah',
  'nallah',
  'nala',
  'canal',
  'waterway',
  'ditch',
  'river',
  'stream',
  'creek',
  'brook',
  'estuary',
  'delta',
  'ocean',
  'sea',
  'bay of',
  'bay',
  'gulf of',
  'gulf',
  'strait',
  'cove',
  'lagoon',
  'basin',
  'reservoir',
  'pond',
  'waterbody',
  'water body'
];

/**
 * Checks whether a given latitude/longitude coordinate is located in a water body,
 * lake, river, wetland, drain, jheel, reservoir, canal, or ocean.
 */
export async function checkIfWaterLocation(lat: number, lng: number): Promise<WaterCheckResult> {
  // Validate coordinates
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return {
      isWater: true,
      reason: 'Invalid geographical coordinates.'
    };
  }

  const cacheKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (checkCache.has(cacheKey)) {
    return checkCache.get(cacheKey)!;
  }

  try {
    // 1. Primary check: OpenStreetMap Nominatim reverse geocode at zoom level 17
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=17&addressdetails=1&extratags=1`,
      {
        headers: {
          'User-Agent': 'ProjectSadak-WaterValidator/1.0'
        }
      }
    );

    if (res.ok) {
      const data = await res.json();

      // Case A: Nominatim returned an error (e.g. "Unable to geocode")
      // In deep oceans / open seas / offshore waters, there are no address polygons.
      if (data.error) {
        try {
          const lowZoomRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=4&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'ProjectSadak-WaterValidator/1.0'
              }
            }
          );
          if (lowZoomRes.ok) {
            const lowZoomData = await lowZoomRes.json();
            if (
              lowZoomData.error ||
              lowZoomData.addresstype === 'sea' ||
              lowZoomData.addresstype === 'ocean' ||
              lowZoomData.type === 'water' ||
              lowZoomData.category === 'natural' ||
              lowZoomData.category === 'water'
            ) {
              const result: WaterCheckResult = {
                isWater: true,
                waterName: lowZoomData.name || lowZoomData.display_name || 'Open Ocean / Sea',
                reason: 'Location is located in open sea or ocean with no road or land surface.'
              };
              checkCache.set(cacheKey, result);
              return result;
            }
          }
        } catch {
          const result: WaterCheckResult = {
            isWater: true,
            waterName: 'Open Ocean / Sea',
            reason: 'Location is in open ocean or off-shore waters.'
          };
          checkCache.set(cacheKey, result);
          return result;
        }
      }

      // Case B: Nominatim returned geographical metadata
      const type = (data.type || '').toLowerCase();
      const category = (data.category || '').toLowerCase();
      const osmClass = (data.class || '').toLowerCase();
      const addresstype = (data.addresstype || '').toLowerCase();
      const displayName = (data.display_name || '').toLowerCase();
      const name = (data.name || '').toLowerCase();
      const address = data.address || {};

      // Check if place name or display name explicitly mentions water features (e.g. "Najafgarh Jheel", "Dal Lake", "Yamuna River")
      const matchedKeyword = WATER_KEYWORDS.find(
        (kw) =>
          name.includes(kw) ||
          displayName.split(',')[0].includes(kw) ||
          displayName.includes(kw)
      );

      const isExplicitWaterType =
        WATER_TYPES.has(type) ||
        WATER_TYPES.has(category) ||
        WATER_TYPES.has(osmClass) ||
        WATER_TYPES.has(addresstype);

      const hasWaterAddressField = Boolean(
        address.water ||
        address.waterway ||
        address.sea ||
        address.ocean ||
        address.bay ||
        address.river ||
        address.lake ||
        address.reservoir ||
        address.harbour ||
        address.marina ||
        address.wetland
      );

      // If the location matches a water body name/type/address
      if (isExplicitWaterType || hasWaterAddressField || matchedKeyword) {
        // Only allow if this is an explicit bridge on a classified road
        const isBridge = address.bridge || type === 'bridge' || displayName.includes('bridge') || displayName.includes('flyover') || displayName.includes('setu');
        const isClassifiedRoad = Boolean(
          address.road ||
          address.highway ||
          address.motorway ||
          address.trunk ||
          address.primary ||
          address.secondary
        );

        // If it's not a verified bridge on a classified road, block as water
        if (!isBridge || !isClassifiedRoad) {
          const detectedName =
            data.name ||
            address.water ||
            address.waterway ||
            address.lake ||
            address.river ||
            address.wetland ||
            data.display_name?.split(',')[0] ||
            matchedKeyword ||
            'Water body';

          const result: WaterCheckResult = {
            isWater: true,
            waterName: detectedName,
            reason: `Location is situated in a water body or wetland (${detectedName}). Potholes can only be reported on roads or land.`
          };
          checkCache.set(cacheKey, result);
          return result;
        }
      }

      // Check if explicit road or street is present
      const hasRoad = Boolean(
        address.road ||
        address.highway ||
        address.pedestrian ||
        address.footway ||
        address.path ||
        address.cycleway ||
        address.street ||
        address.residential ||
        address.bridge
      );

      if (hasRoad) {
        const roadName =
          address.road ||
          address.highway ||
          address.pedestrian ||
          address.street ||
          address.suburb ||
          address.neighbourhood ||
          address.city ||
          'Road surface';

        const result: WaterCheckResult = {
          isWater: false,
          roadName
        };
        checkCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (error) {
    console.warn('Primary water check failed, checking Overpass API fallback:', error);
  }

  // 2. Secondary Overpass API query: check for any water or wetland polygon within 100 meters
  try {
    const overpassQuery = `[out:json][timeout:5];(
      way(around:100,${lat},${lng})["natural"="water"];
      way(around:100,${lat},${lng})["natural"="wetland"];
      way(around:100,${lat},${lng})["waterway"];
      way(around:100,${lat},${lng})["water"];
      way(around:100,${lat},${lng})["landuse"="reservoir"];
      way(around:100,${lat},${lng})["landuse"="basin"];
      relation(around:100,${lat},${lng})["natural"="water"];
      relation(around:100,${lat},${lng})["natural"="wetland"];
      relation(around:100,${lat},${lng})["waterway"];
      relation(around:100,${lat},${lng})["water"];
      relation(around:100,${lat},${lng})["landuse"="reservoir"];
      relation(around:100,${lat},${lng})["landuse"="basin"];
    );out tags 3;`;

    const overpassRes = await fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`
    );

    if (overpassRes.ok) {
      const overpassData = await overpassRes.json();
      if (overpassData.elements && overpassData.elements.length > 0) {
        const firstElement = overpassData.elements[0];
        const tags = firstElement.tags || {};
        const waterName =
          tags.name ||
          tags['name:en'] ||
          tags.water ||
          tags.natural ||
          tags.waterway ||
          tags.wetland ||
          'Water body / Wetland';

        const result: WaterCheckResult = {
          isWater: true,
          waterName,
          reason: `Location is situated in or adjacent to a water body or wetland (${waterName}).`
        };
        checkCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (overpassErr) {
    console.warn('Overpass check failed:', overpassErr);
  }

  // 3. Fallback Nominatim low-zoom check (in case zoom 17 didn't match an unnamed large water polygon)
  try {
    const broadRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'ProjectSadak-WaterValidator/1.0'
        }
      }
    );
    if (broadRes.ok) {
      const broadData = await broadRes.json();
      const broadName = (broadData.name || broadData.display_name || '').toLowerCase();
      const matched = WATER_KEYWORDS.find((kw) => broadName.includes(kw));
      if (matched) {
        const result: WaterCheckResult = {
          isWater: true,
          waterName: broadData.name || broadData.display_name?.split(',')[0] || matched,
          reason: `Location corresponds to a regional water body / wetland (${broadData.name || matched}).`
        };
        checkCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (broadErr) {
    console.warn('Broad zoom check failed:', broadErr);
  }

  // Default to non-water
  const defaultResult: WaterCheckResult = { isWater: false };
  checkCache.set(cacheKey, defaultResult);
  return defaultResult;
}
