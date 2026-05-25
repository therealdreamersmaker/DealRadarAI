// US real estate markets — cities, neighborhoods, and key zip codes
// Covers every US city > ~50k population plus top wholesale markets
export const LOCATIONS = [
  // ── Pennsylvania ─────────────────────────────────────────────────────────────
  "Allentown, PA", "Allentown, PA 18101", "Allentown, PA 18103",
  "Bethlehem, PA", "Bethlehem, PA 18015",
  "Easton, PA", "Easton, PA 18042",
  "Reading, PA", "Reading, PA 19601", "Reading, PA 19604",
  "Scranton, PA", "Scranton, PA 18503",
  "Wilkes-Barre, PA", "Wilkes-Barre, PA 18701",
  "Lancaster, PA", "Lancaster, PA 17601",
  "York, PA", "York, PA 17401",
  "Harrisburg, PA", "Harrisburg, PA 17101",
  "Erie, PA", "Erie, PA 16501",
  "Altoona, PA", "Altoona, PA 16601",
  "Philadelphia, PA", "Philadelphia, PA 19101", "Philadelphia, PA 19132", "Philadelphia, PA 19140",
  "Pittsburgh, PA", "Pittsburgh, PA 15201", "Pittsburgh, PA 15210",

  // ── New Jersey ───────────────────────────────────────────────────────────────
  "Jersey City, NJ", "Jersey City, NJ 07302",
  "Paterson, NJ", "Paterson, NJ 07501",
  "Elizabeth, NJ", "Elizabeth, NJ 07201",
  "Trenton, NJ", "Trenton, NJ 08601",
  "Camden, NJ", "Camden, NJ 08101",
  "Newark, NJ", "Newark, NJ 07101", "Newark, NJ 07103",
  "Clifton, NJ", "Clifton, NJ 07011",
  "Bridgeton, NJ", "Bridgeton, NJ 08302",

  // ── New York ─────────────────────────────────────────────────────────────────
  "New York, NY",
  "Brooklyn, NY", "Brooklyn, NY 11207", "Brooklyn, NY 11212",
  "Bronx, NY", "Bronx, NY 10451", "Bronx, NY 10456",
  "Queens, NY", "Queens, NY 11368",
  "Buffalo, NY", "Buffalo, NY 14201",
  "Rochester, NY", "Rochester, NY 14601",
  "Syracuse, NY", "Syracuse, NY 13201",
  "Albany, NY", "Albany, NY 12201",
  "Yonkers, NY", "Yonkers, NY 10701",
  "Utica, NY", "Utica, NY 13501",
  "Schenectady, NY", "Schenectady, NY 12305",
  "Newburgh, NY", "Newburgh, NY 12550",
  "Mount Vernon, NY", "New Rochelle, NY",

  // ── Massachusetts ────────────────────────────────────────────────────────────
  "Boston, MA", "Boston, MA 02101", "Boston, MA 02119",
  "Worcester, MA", "Worcester, MA 01601",
  "Springfield, MA", "Springfield, MA 01101",
  "Lowell, MA", "Lowell, MA 01851",
  "Lynn, MA", "Lynn, MA 01901",
  "Fall River, MA", "Fall River, MA 02720",
  "New Bedford, MA", "New Bedford, MA 02740",
  "Brockton, MA", "Brockton, MA 02301",
  "Quincy, MA", "Quincy, MA 02169",
  "Lawrence, MA", "Lawrence, MA 01840",
  "Haverhill, MA", "Haverhill, MA 01830",

  // ── Connecticut ──────────────────────────────────────────────────────────────
  "Hartford, CT", "Hartford, CT 06101",
  "Bridgeport, CT", "Bridgeport, CT 06601",
  "New Haven, CT", "New Haven, CT 06501",
  "Waterbury, CT", "Waterbury, CT 06701",
  "Stamford, CT", "Stamford, CT 06901",
  "Norwalk, CT", "Norwalk, CT 06850",

  // ── Rhode Island ─────────────────────────────────────────────────────────────
  "Providence, RI", "Providence, RI 02901",
  "Cranston, RI", "Cranston, RI 02910",
  "Warwick, RI", "Warwick, RI 02886",
  "Pawtucket, RI", "Pawtucket, RI 02860",

  // ── Maryland ─────────────────────────────────────────────────────────────────
  "Baltimore, MD", "Baltimore, MD 21201", "Baltimore, MD 21213", "Baltimore, MD 21223",
  "Frederick, MD", "Frederick, MD 21701",
  "Hagerstown, MD", "Hagerstown, MD 21740",
  "Gaithersburg, MD",
  "Rockville, MD",

  // ── Virginia ─────────────────────────────────────────────────────────────────
  "Richmond, VA", "Richmond, VA 23219", "Richmond, VA 23224",
  "Norfolk, VA", "Norfolk, VA 23501",
  "Virginia Beach, VA", "Virginia Beach, VA 23451",
  "Chesapeake, VA", "Chesapeake, VA 23320",
  "Hampton, VA", "Hampton, VA 23661",
  "Newport News, VA", "Newport News, VA 23601",
  "Roanoke, VA", "Roanoke, VA 24011",
  "Alexandria, VA", "Alexandria, VA 22301",

  // ── West Virginia ────────────────────────────────────────────────────────────
  "Charleston, WV", "Charleston, WV 25301",
  "Huntington, WV", "Huntington, WV 25701",
  "Parkersburg, WV", "Parkersburg, WV 26101",
  "Morgantown, WV", "Morgantown, WV 26501",

  // ── Washington, DC ───────────────────────────────────────────────────────────
  "Washington, DC", "Washington, DC 20001", "Washington, DC 20019",

  // ── Delaware ─────────────────────────────────────────────────────────────────
  "Wilmington, DE", "Wilmington, DE 19801",
  "Dover, DE", "Dover, DE 19901",

  // ── North Carolina ───────────────────────────────────────────────────────────
  "Charlotte, NC", "Charlotte, NC 28201", "Charlotte, NC 28206", "Charlotte, NC 28216",
  "Raleigh, NC", "Raleigh, NC 27601", "Raleigh, NC 27610",
  "Greensboro, NC", "Greensboro, NC 27401",
  "Durham, NC", "Durham, NC 27701",
  "Winston-Salem, NC", "Winston-Salem, NC 27101",
  "Fayetteville, NC", "Fayetteville, NC 28301",
  "High Point, NC", "High Point, NC 27260",
  "Concord, NC", "Concord, NC 28025",
  "Jacksonville, NC", "Jacksonville, NC 28540",
  "Asheville, NC", "Asheville, NC 28801",

  // ── South Carolina ───────────────────────────────────────────────────────────
  "Charleston, SC", "Charleston, SC 29401", "Charleston, SC 29405",
  "Columbia, SC", "Columbia, SC 29201",
  "Greenville, SC", "Greenville, SC 29601",
  "North Charleston, SC", "North Charleston, SC 29406",
  "Rock Hill, SC", "Rock Hill, SC 29730",
  "Spartanburg, SC", "Spartanburg, SC 29301",
  "Myrtle Beach, SC", "Myrtle Beach, SC 29577",

  // ── Georgia ──────────────────────────────────────────────────────────────────
  "Atlanta, GA", "Atlanta, GA 30301", "Atlanta, GA 30315", "Atlanta, GA 30318",
  "Savannah, GA", "Savannah, GA 31401",
  "Augusta, GA", "Augusta, GA 30901",
  "Macon, GA", "Macon, GA 31201",
  "Columbus, GA", "Columbus, GA 31901",
  "Athens, GA", "Athens, GA 30601",
  "Warner Robins, GA", "Warner Robins, GA 31088",
  "Marietta, GA", "Marietta, GA 30060",
  "Smyrna, GA", "Albany, GA",

  // ── Florida ──────────────────────────────────────────────────────────────────
  "Miami, FL", "Miami, FL 33101", "Miami, FL 33127", "Miami, FL 33142",
  "Jacksonville, FL", "Jacksonville, FL 32202", "Jacksonville, FL 32209",
  "Tampa, FL", "Tampa, FL 33602", "Tampa, FL 33605", "Tampa, FL 33610",
  "Orlando, FL", "Orlando, FL 32801", "Orlando, FL 32805", "Orlando, FL 32811",
  "St. Petersburg, FL", "St. Petersburg, FL 33701",
  "Fort Lauderdale, FL", "Fort Lauderdale, FL 33301",
  "Tallahassee, FL", "Tallahassee, FL 32301",
  "Cape Coral, FL", "Cape Coral, FL 33904",
  "Fort Myers, FL", "Fort Myers, FL 33901",
  "Port St. Lucie, FL", "Port St. Lucie, FL 34983",
  "Pembroke Pines, FL", "Hollywood, FL", "Miramar, FL",
  "Gainesville, FL", "Gainesville, FL 32601",
  "Lakeland, FL", "Lakeland, FL 33801",
  "Clearwater, FL", "Clearwater, FL 33755",
  "Pompano Beach, FL", "Pompano Beach, FL 33060",
  "West Palm Beach, FL", "West Palm Beach, FL 33401",
  "Hialeah, FL", "Hialeah, FL 33010",
  "Pensacola, FL", "Pensacola, FL 32501",
  "Daytona Beach, FL", "Daytona Beach, FL 32114",
  "Ocala, FL", "Ocala, FL 34471",

  // ── Alabama ──────────────────────────────────────────────────────────────────
  "Birmingham, AL", "Birmingham, AL 35201", "Birmingham, AL 35208", "Birmingham, AL 35212",
  "Montgomery, AL", "Montgomery, AL 36101",
  "Huntsville, AL", "Huntsville, AL 35801",
  "Mobile, AL", "Mobile, AL 36601",
  "Tuscaloosa, AL", "Tuscaloosa, AL 35401",
  "Dothan, AL", "Dothan, AL 36301",
  "Decatur, AL", "Gadsden, AL", "Florence, AL",

  // ── Mississippi ──────────────────────────────────────────────────────────────
  "Jackson, MS", "Jackson, MS 39201",
  "Gulfport, MS", "Gulfport, MS 39501",
  "Biloxi, MS", "Biloxi, MS 39530",
  "Hattiesburg, MS", "Hattiesburg, MS 39401",

  // ── Tennessee ────────────────────────────────────────────────────────────────
  "Nashville, TN", "Nashville, TN 37201", "Nashville, TN 37208", "Nashville, TN 37211",
  "Memphis, TN", "Memphis, TN 38101", "Memphis, TN 38106", "Memphis, TN 38114",
  "Knoxville, TN", "Knoxville, TN 37901",
  "Chattanooga, TN", "Chattanooga, TN 37401",
  "Clarksville, TN", "Clarksville, TN 37040",
  "Murfreesboro, TN", "Murfreesboro, TN 37130",

  // ── Kentucky ─────────────────────────────────────────────────────────────────
  "Louisville, KY", "Louisville, KY 40201", "Louisville, KY 40210",
  "Lexington, KY", "Lexington, KY 40501",
  "Bowling Green, KY", "Bowling Green, KY 42101",
  "Owensboro, KY", "Owensboro, KY 42301",
  "Covington, KY", "Covington, KY 41011",

  // ── Ohio ─────────────────────────────────────────────────────────────────────
  "Columbus, OH", "Columbus, OH 43201", "Columbus, OH 43205", "Columbus, OH 43207",
  "Cleveland, OH", "Cleveland, OH 44101", "Cleveland, OH 44105", "Cleveland, OH 44108",
  "Cincinnati, OH", "Cincinnati, OH 45201", "Cincinnati, OH 45205",
  "Dayton, OH", "Dayton, OH 45401",
  "Toledo, OH", "Toledo, OH 43601",
  "Akron, OH", "Akron, OH 44301",
  "Canton, OH", "Canton, OH 44702",
  "Youngstown, OH", "Youngstown, OH 44501",
  "Parma, OH", "Lorain, OH", "Springfield, OH",

  // ── Michigan ─────────────────────────────────────────────────────────────────
  "Detroit, MI", "Detroit, MI 48201", "Detroit, MI 48206", "Detroit, MI 48228",
  "Grand Rapids, MI", "Grand Rapids, MI 49501",
  "Warren, MI", "Warren, MI 48089",
  "Sterling Heights, MI",
  "Flint, MI", "Flint, MI 48501",
  "Lansing, MI", "Lansing, MI 48901",
  "Ann Arbor, MI", "Ann Arbor, MI 48101",
  "Dearborn, MI", "Dearborn, MI 48120",
  "Pontiac, MI", "Saginaw, MI", "Kalamazoo, MI",

  // ── Indiana ──────────────────────────────────────────────────────────────────
  "Indianapolis, IN", "Indianapolis, IN 46201", "Indianapolis, IN 46218", "Indianapolis, IN 46222",
  "Fort Wayne, IN", "Fort Wayne, IN 46801",
  "Evansville, IN", "Evansville, IN 47701",
  "South Bend, IN", "South Bend, IN 46601",
  "Gary, IN", "Gary, IN 46401",
  "Hammond, IN", "Muncie, IN",

  // ── Wisconsin ────────────────────────────────────────────────────────────────
  "Milwaukee, WI", "Milwaukee, WI 53201", "Milwaukee, WI 53206",
  "Madison, WI", "Madison, WI 53701",
  "Green Bay, WI", "Green Bay, WI 54301",
  "Racine, WI", "Racine, WI 53401",
  "Kenosha, WI", "Kenosha, WI 53140",
  "Appleton, WI",

  // ── Illinois ─────────────────────────────────────────────────────────────────
  "Chicago, IL", "Chicago, IL 60601", "Chicago, IL 60621", "Chicago, IL 60636",
  "Rockford, IL", "Rockford, IL 61101",
  "Aurora, IL", "Aurora, IL 60505",
  "Joliet, IL", "Joliet, IL 60431",
  "Naperville, IL", "Peoria, IL", "Elgin, IL", "Waukegan, IL",

  // ── Minnesota ────────────────────────────────────────────────────────────────
  "Minneapolis, MN", "Minneapolis, MN 55401", "Minneapolis, MN 55411",
  "Saint Paul, MN", "Saint Paul, MN 55101",
  "Rochester, MN", "Rochester, MN 55901",
  "Duluth, MN", "Duluth, MN 55801",

  // ── Iowa ─────────────────────────────────────────────────────────────────────
  "Des Moines, IA", "Des Moines, IA 50301",
  "Cedar Rapids, IA", "Cedar Rapids, IA 52401",
  "Davenport, IA", "Davenport, IA 52801",
  "Sioux City, IA", "Iowa City, IA",

  // ── Missouri ─────────────────────────────────────────────────────────────────
  "Kansas City, MO", "Kansas City, MO 64101", "Kansas City, MO 64108",
  "St. Louis, MO", "St. Louis, MO 63101", "St. Louis, MO 63106", "St. Louis, MO 63115",
  "Springfield, MO", "Springfield, MO 65801",
  "Columbia, MO", "Independence, MO", "Lee's Summit, MO",

  // ── Kansas ───────────────────────────────────────────────────────────────────
  "Wichita, KS", "Wichita, KS 67201",
  "Overland Park, KS", "Kansas City, KS", "Kansas City, KS 66101",
  "Topeka, KS", "Topeka, KS 66601",
  "Lawrence, KS",

  // ── Nebraska ─────────────────────────────────────────────────────────────────
  "Omaha, NE", "Omaha, NE 68101",
  "Lincoln, NE", "Lincoln, NE 68501",
  "Bellevue, NE",

  // ── South Dakota ─────────────────────────────────────────────────────────────
  "Sioux Falls, SD", "Sioux Falls, SD 57101",
  "Rapid City, SD",

  // ── North Dakota ─────────────────────────────────────────────────────────────
  "Fargo, ND", "Fargo, ND 58101",
  "Bismarck, ND",

  // ── Arkansas ─────────────────────────────────────────────────────────────────
  "Little Rock, AR", "Little Rock, AR 72201",
  "Fort Smith, AR", "Fort Smith, AR 72901",
  "Fayetteville, AR", "Fayetteville, AR 72701",
  "Jonesboro, AR", "Springdale, AR",

  // ── Louisiana ────────────────────────────────────────────────────────────────
  "New Orleans, LA", "New Orleans, LA 70112", "New Orleans, LA 70117",
  "Baton Rouge, LA", "Baton Rouge, LA 70801", "Baton Rouge, LA 70805",
  "Shreveport, LA", "Shreveport, LA 71101",
  "Lafayette, LA", "Lafayette, LA 70501",
  "Lake Charles, LA",

  // ── Oklahoma ─────────────────────────────────────────────────────────────────
  "Oklahoma City, OK", "Oklahoma City, OK 73101", "Oklahoma City, OK 73107",
  "Tulsa, OK", "Tulsa, OK 74101", "Tulsa, OK 74106",
  "Norman, OK", "Broken Arrow, OK", "Lawton, OK", "Edmond, OK",

  // ── Texas ────────────────────────────────────────────────────────────────────
  "Houston, TX", "Houston, TX 77001", "Houston, TX 77051", "Houston, TX 77084",
  "Dallas, TX", "Dallas, TX 75201", "Dallas, TX 75208", "Dallas, TX 75217",
  "Fort Worth, TX", "Fort Worth, TX 76104", "Fort Worth, TX 76110",
  "San Antonio, TX", "San Antonio, TX 78201", "San Antonio, TX 78207",
  "Austin, TX", "Austin, TX 78701", "Austin, TX 78745", "Austin, TX 78702",
  "El Paso, TX", "El Paso, TX 79901",
  "Arlington, TX", "Arlington, TX 76001",
  "Plano, TX", "Plano, TX 75023",
  "Irving, TX", "Irving, TX 75015",
  "Garland, TX", "Garland, TX 75040",
  "Mesquite, TX", "Mesquite, TX 75149",
  "Lubbock, TX", "Lubbock, TX 79401",
  "Laredo, TX", "Laredo, TX 78040",
  "Corpus Christi, TX", "Corpus Christi, TX 78401",
  "Amarillo, TX", "Amarillo, TX 79101",
  "McAllen, TX", "McAllen, TX 78501",
  "Beaumont, TX", "Beaumont, TX 77701",
  "Killeen, TX", "Killeen, TX 76541",
  "Waco, TX", "Waco, TX 76701",
  "Midland, TX", "Midland, TX 79701",
  "Odessa, TX", "Odessa, TX 79761",
  "Abilene, TX", "Abilene, TX 79601",
  "Tyler, TX", "Tyler, TX 75701",
  "Wichita Falls, TX", "Wichita Falls, TX 76301",
  "San Marcos, TX", "Round Rock, TX",

  // ── New Mexico ───────────────────────────────────────────────────────────────
  "Albuquerque, NM", "Albuquerque, NM 87101",
  "Las Cruces, NM", "Las Cruces, NM 88001",
  "Rio Rancho, NM", "Santa Fe, NM",

  // ── Colorado ─────────────────────────────────────────────────────────────────
  "Denver, CO", "Denver, CO 80201", "Denver, CO 80205", "Denver, CO 80219",
  "Colorado Springs, CO", "Colorado Springs, CO 80901",
  "Aurora, CO", "Aurora, CO 80010",
  "Fort Collins, CO", "Fort Collins, CO 80521",
  "Lakewood, CO", "Thornton, CO", "Westminster, CO", "Arvada, CO",
  "Greeley, CO", "Centennial, CO", "Boulder, CO",
  "Pueblo, CO", "Pueblo, CO 81001",

  // ── Arizona ──────────────────────────────────────────────────────────────────
  "Phoenix, AZ", "Phoenix, AZ 85001", "Phoenix, AZ 85015", "Phoenix, AZ 85031",
  "Tucson, AZ", "Tucson, AZ 85701", "Tucson, AZ 85706",
  "Mesa, AZ", "Mesa, AZ 85201",
  "Chandler, AZ", "Chandler, AZ 85224",
  "Glendale, AZ", "Glendale, AZ 85301",
  "Gilbert, AZ", "Gilbert, AZ 85234",
  "Tempe, AZ", "Tempe, AZ 85281",
  "Scottsdale, AZ", "Scottsdale, AZ 85251",
  "Peoria, AZ", "Surprise, AZ", "Goodyear, AZ",
  "Flagstaff, AZ", "Yuma, AZ",

  // ── Nevada ───────────────────────────────────────────────────────────────────
  "Las Vegas, NV", "Las Vegas, NV 89101", "Las Vegas, NV 89108", "Las Vegas, NV 89115",
  "Henderson, NV", "Henderson, NV 89002",
  "Reno, NV", "Reno, NV 89501",
  "North Las Vegas, NV", "Sparks, NV",

  // ── Utah ─────────────────────────────────────────────────────────────────────
  "Salt Lake City, UT", "Salt Lake City, UT 84101",
  "West Valley City, UT", "Provo, UT", "Provo, UT 84601",
  "West Jordan, UT", "Orem, UT", "Sandy, UT",
  "Ogden, UT", "Ogden, UT 84401",

  // ── Idaho ────────────────────────────────────────────────────────────────────
  "Boise, ID", "Boise, ID 83701",
  "Nampa, ID", "Meridian, ID", "Pocatello, ID", "Twin Falls, ID",

  // ── Montana ──────────────────────────────────────────────────────────────────
  "Billings, MT", "Billings, MT 59101",
  "Missoula, MT", "Great Falls, MT",

  // ── Wyoming ──────────────────────────────────────────────────────────────────
  "Cheyenne, WY", "Casper, WY",

  // ── Oregon ───────────────────────────────────────────────────────────────────
  "Portland, OR", "Portland, OR 97201", "Portland, OR 97211",
  "Eugene, OR", "Eugene, OR 97401",
  "Salem, OR", "Salem, OR 97301",
  "Gresham, OR", "Hillsboro, OR", "Medford, OR",

  // ── Washington ───────────────────────────────────────────────────────────────
  "Seattle, WA", "Seattle, WA 98101", "Seattle, WA 98118",
  "Spokane, WA", "Spokane, WA 99201",
  "Tacoma, WA", "Tacoma, WA 98401",
  "Vancouver, WA", "Vancouver, WA 98660",
  "Bellevue, WA", "Everett, WA", "Renton, WA", "Kent, WA",
  "Kirkland, WA", "Yakima, WA", "Bellingham, WA",

  // ── Alaska ───────────────────────────────────────────────────────────────────
  "Anchorage, AK", "Anchorage, AK 99501",
  "Fairbanks, AK",

  // ── Hawaii ───────────────────────────────────────────────────────────────────
  "Honolulu, HI", "Honolulu, HI 96801",
  "Hilo, HI", "Kailua, HI",

  // ── California ───────────────────────────────────────────────────────────────
  "Los Angeles, CA", "Los Angeles, CA 90001", "Los Angeles, CA 90011", "Los Angeles, CA 90044",
  "San Diego, CA", "San Diego, CA 92101", "San Diego, CA 92114",
  "San Jose, CA", "San Jose, CA 95101",
  "San Francisco, CA", "San Francisco, CA 94102",
  "Fresno, CA", "Fresno, CA 93701", "Fresno, CA 93706",
  "Sacramento, CA", "Sacramento, CA 95814", "Sacramento, CA 95820",
  "Long Beach, CA", "Long Beach, CA 90801",
  "Oakland, CA", "Oakland, CA 94601", "Oakland, CA 94603",
  "Bakersfield, CA", "Bakersfield, CA 93301",
  "Anaheim, CA", "Anaheim, CA 92801",
  "Santa Ana, CA", "Santa Ana, CA 92701",
  "Riverside, CA", "Riverside, CA 92501",
  "Stockton, CA", "Stockton, CA 95202",
  "Irvine, CA", "Chula Vista, CA", "Fremont, CA",
  "San Bernardino, CA", "San Bernardino, CA 92401",
  "Modesto, CA", "Modesto, CA 95351",
  "Fontana, CA", "Moreno Valley, CA",
  "Glendale, CA", "Oxnard, CA",
  "Rancho Cucamonga, CA", "Pomona, CA",
  "Garden Grove, CA", "Lancaster, CA", "Palmdale, CA",
  "Salinas, CA", "Hayward, CA", "Escondido, CA",

  // ── New Hampshire ────────────────────────────────────────────────────────────
  "Manchester, NH", "Manchester, NH 03101",
  "Nashua, NH",

  // ── Vermont ──────────────────────────────────────────────────────────────────
  "Burlington, VT", "Burlington, VT 05401",

  // ── Maine ────────────────────────────────────────────────────────────────────
  "Portland, ME", "Portland, ME 04101",
  "Bangor, ME",

  // ── Hot wholesale neighborhoods ───────────────────────────────────────────────
  "West End, Atlanta, GA",
  "Sylvan Hills, Atlanta, GA",
  "Capitol View, Atlanta, GA",
  "Third Ward, Houston, TX",
  "Fifth Ward, Houston, TX",
  "Oak Cliff, Dallas, TX",
  "South Dallas, TX",
  "East Austin, TX",
  "South Side, Chicago, IL",
  "West Side, Chicago, IL",
  "Liberty City, Miami, FL",
  "Overtown, Miami, FL",
  "Opa-locka, FL",
  "East Baltimore, MD",
  "West Baltimore, MD",
  "North Philadelphia, PA",
  "West Philadelphia, PA",
  "East Cleveland, OH",
  "South Memphis, TN",
  "North Memphis, TN",
  "Northside, Birmingham, AL",
  "West Allentown, PA",
  "South Side, Allentown, PA",
]

// ── US state abbreviation set ─────────────────────────────────────────────────
const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
])

/**
 * Try to normalise a free-form "City ST" / "City, ST" query into "City, ST"
 * so the user can search any US city without it needing to be in our list.
 */
function normalizeAsLocation(query) {
  const trimmed = query.trim()
  // Match "City Name ST" or "City Name, ST" (with optional zip)
  const m = trimmed.match(/^([a-zA-Z\s.'/-]+?)\s*,?\s*([A-Za-z]{2})(?:\s+\d{5})?$/)
  if (!m) return null
  const city  = m[1].trim().replace(/\b\w/g, c => c.toUpperCase())
  const state = m[2].toUpperCase()
  if (!US_STATES.has(state)) return null
  return `${city}, ${state}`
}

export function getSuggestions(query) {
  if (!query || query.length < 2) return []
  const q   = query.toLowerCase().trim()
  const raw = query.trim()

  // Match against the curated list
  const matches = LOCATIONS.filter(loc => loc.toLowerCase().includes(q))

  // Any 5-digit number = ZIP code → surface it directly even if not in our list
  if (/^\d{5}$/.test(raw) && !matches.some(m => m.includes(raw))) {
    matches.unshift(raw)
  }

  // Free-form fallback: if the user typed "City, ST" (or "City ST") and it
  // isn't in our list yet, surface it at the top so they can still search it.
  if (raw.length >= 3) {
    const normalized = normalizeAsLocation(raw)
    if (normalized && !matches.some(m => m.toLowerCase() === normalized.toLowerCase())) {
      matches.unshift(normalized)
    }
  }

  return matches.slice(0, 8)
}
