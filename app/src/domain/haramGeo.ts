// Fixed geometry of the holy sites, taken from OpenStreetMap (© OpenStreetMap
// contributors, ODbL) and checked against Wikipedia. OSM ids are given so each
// value can be checked again. Data retrieved 2026-10-26.
//
// Accuracy: OSM is traced from aerial imagery, so absolute positions can be
// off by a few metres (imagery offset). Shapes and relative directions, such
// as the Kaaba's corner bearings, are more reliable than the absolute positions.

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Centre of the Kaaba: the area centroid of OSM way 103914569 ("الكعبة / Kaaba").
 * Cross-check: Wikipedia "Kaaba" gives 21°25′21″N 39°49′34″E (21.4225, 39.82617),
 * about 2 m from this point.
 */
export const KAABA_CENTER: LatLng = { lat: 21.422517, lng: 39.826182 };

/**
 * Bearing in degrees true from KAABA_CENTER to the Black Stone (Hajar al-Aswad)
 * corner: about 105°, so east, slightly towards the south.
 * Source: the Black Stone is OSM node 1199442721 (historic=stone, "الحجر الأسود"),
 * at 21.4224985, 39.8262546. That node is the eastern corner vertex of the Kaaba
 * way 103914569, about 7.8 m from the centroid.
 * Cross-checks: Wikipedia says the Black Stone sits on the eastern corner and
 * "faces very slightly southeast from the center". The same way gives the other
 * corners at about 8° (Iraqi, NE), 187° (Yemeni, SW) and 287° (Levantine, NW),
 * which matches Wikipedia's description. The south-east wall faces about 146°,
 * consistent with the published alignment of that wall to the rising of Canopus
 * (about 149° at Makkah).
 * Uncertainty: about ±5°, because the way is traced from imagery. No surveyed
 * azimuth was found.
 */
export const BLACK_STONE_BEARING_DEG = 105;

/** The Black Stone corner itself (OSM node 1199442721). */
export const BLACK_STONE: LatLng = { lat: 21.4224985, lng: 39.8262546 };

/**
 * As-Safa hill: OSM node 4589923995 (natural=peak, "الصفا"), the hill at the
 * southern end of the Mas'a. The domed building over it (way 136524020,
 * "جبل الصفا") has its centre about 9 m from this point.
 */
export const SAFA: LatLng = { lat: 21.4218, lng: 39.827431 };

/**
 * Al-Marwah hill: OSM node 4589923996 (natural=peak/GNS hill, "المروة"), at the
 * northern end of the Mas'a. The building over it (way 136524024) has its
 * centre about 10 m from this point.
 * Note: these two points are about 376 m apart. Wikipedia "Safa and Marwa"
 * gives "approximately 450 m"; that figure counts the walking distance along
 * the gallery, not the distance between the hill centres. The midpoint of
 * SAFA and MARWAH is about 14 m from Wikipedia's coordinate for the pair
 * (21.42361, 39.82722).
 */
export const MARWAH: LatLng = { lat: 21.425175, lng: 39.827128 };

/**
 * Centre of the Masjid an-Nabawi building: the area centroid of OSM way
 * 461699097 ("المسجد النبوي", about 98,000 m²).
 * Cross-check: Wikipedia "Prophet's Mosque" gives 24°28′6″N 39°36′39″E
 * (24.46833, 39.61083), about 60 m south-west of this point, which is still
 * inside the building.
 * The Green Dome (way 232440740) is at 24.467566, 39.611446.
 */
export const NABAWI_CENTER: LatLng = { lat: 24.468792, lng: 39.61116 };

/** The Green Dome over the Prophet's ﷺ chamber (OSM way 232440740, centre). */
export const GREEN_DOME: LatLng = { lat: 24.467566, lng: 39.611446 };

/**
 * The Masjid al-Haram building as simplified polygons, as [lat, lng] rings.
 * Each ring is closed implicitly: the last point joins back to the first.
 * Source: the outer rings of OSM multipolygon relation 1472531 ("المسجد الحرام",
 * building=mosque). That relation has three separate building blocks that do
 * not touch, so this is a multi-polygon:
 *   [0] main mosque around the Mataf, including the Mas'a (Safa to Marwah);
 *       about 117,000 m²
 *   [1] western/north-western block (probably the King Fahd expansion); about 70,000 m²
 *   [2] far north-western block (probably the King Abdullah expansion); about 121,000 m²
 *   OSM leaves these blocks unnamed; the expansion names are inferred from their position.
 * The rings were simplified with Douglas-Peucker (tolerance 16.5 m) to 60
 * points in total; ring areas stay within 6% of the originals. The open-air
 * Mataf around the Kaaba is an inner hole in OSM and is left out here, so
 * KAABA_CENTER falls "inside" ring 0. The outdoor plazas (sahat) are not part
 * of the building and are not included.
 */
export const HARAM_OUTLINE: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
  [[21.423029,39.824609],[21.423626,39.824955],[21.424003,39.825574],[21.424119,39.826165],[21.423878,39.827044],[21.425376,39.82672],[21.425446,39.82737],[21.422503,39.827791],[21.421661,39.827597],[21.421095,39.826572],[21.421123,39.825588],[21.420767,39.825316],[21.420939,39.82528],[21.420755,39.824981],[21.420852,39.824485],[21.421752,39.823857],[21.422217,39.823963],[21.422399,39.824262],[21.422495,39.824102],[21.422568,39.82454]],
  [[21.425832,39.826513],[21.424305,39.826403],[21.42409,39.825254],[21.423026,39.824337],[21.423682,39.822599],[21.424919,39.823403],[21.425832,39.824858],[21.425877,39.826151],[21.42606,39.826152]],
  [[21.427023,39.826331],[21.427225,39.826084],[21.427129,39.825581],[21.427459,39.82551],[21.427405,39.82515],[21.427079,39.825217],[21.42703,39.824744],[21.426787,39.824725],[21.426864,39.824125],[21.426544,39.823697],[21.426853,39.823473],[21.426666,39.823155],[21.426287,39.823264],[21.425823,39.822563],[21.42568,39.822717],[21.425057,39.822119],[21.425251,39.821789],[21.42502,39.821639],[21.424846,39.821956],[21.424053,39.821605],[21.424464,39.820696],[21.42486,39.820842],[21.425248,39.820219],[21.427143,39.8218],[21.428332,39.823929],[21.42868,39.825829],[21.428492,39.825857],[21.428506,39.826487],[21.427546,39.82666],[21.427553,39.826459],[21.427016,39.826532]],
];
