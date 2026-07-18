import City from "../models/City.js";

const cities = [
  { name: "Mumbai", state: "Maharashtra", state_code: "MH", district: "Mumbai City", latitude: 19.07609, longitude: 72.877426, population: 20667656, is_capital: false, city_type: "metropolitan" },
  { name: "Delhi", state: "Delhi", state_code: "DL", district: "New Delhi", latitude: 28.613939, longitude: 77.209023, population: 32941000, is_capital: true, city_type: "metropolitan" },
  { name: "Bengaluru", state: "Karnataka", state_code: "KA", district: "Bengaluru Urban", latitude: 12.971599, longitude: 77.594566, population: 13193000, is_capital: true, city_type: "metropolitan" },
  { name: "Kolkata", state: "West Bengal", state_code: "WB", district: "Kolkata", latitude: 22.572646, longitude: 88.363895, population: 15133000, is_capital: true, city_type: "metropolitan" },
  { name: "Chennai", state: "Tamil Nadu", state_code: "TN", district: "Chennai", latitude: 13.08268, longitude: 80.270718, population: 11235000, is_capital: true, city_type: "metropolitan" },
  { name: "Hyderabad", state: "Telangana", state_code: "TS", district: "Hyderabad", latitude: 17.385044, longitude: 78.486671, population: 10534418, is_capital: true, city_type: "metropolitan" },
  { name: "Ahmedabad", state: "Gujarat", state_code: "GJ", district: "Ahmedabad", latitude: 23.022505, longitude: 72.571362, population: 8059441, is_capital: false, city_type: "metropolitan" },
  { name: "Pune", state: "Maharashtra", state_code: "MH", district: "Pune", latitude: 18.52043, longitude: 73.856743, population: 7276000, is_capital: false, city_type: "metropolitan" },

  { name: "Surat", state: "Gujarat", state_code: "GJ", district: "Surat", latitude: 21.17024, longitude: 72.831062, population: 7784000, is_capital: false, city_type: "tier1" },
  { name: "Jaipur", state: "Rajasthan", state_code: "RJ", district: "Jaipur", latitude: 26.912434, longitude: 75.78727, population: 3978000, is_capital: true, city_type: "tier1" },
  { name: "Lucknow", state: "Uttar Pradesh", state_code: "UP", district: "Lucknow", latitude: 26.846694, longitude: 80.946166, population: 3752000, is_capital: true, city_type: "tier1" },
  { name: "Kanpur", state: "Uttar Pradesh", state_code: "UP", district: "Kanpur Nagar", latitude: 26.449923, longitude: 80.331874, population: 3144000, is_capital: false, city_type: "tier1" },
  { name: "Nagpur", state: "Maharashtra", state_code: "MH", district: "Nagpur", latitude: 21.145817, longitude: 79.088144, population: 2949000, is_capital: false, city_type: "tier1" },
  { name: "Indore", state: "Madhya Pradesh", state_code: "MP", district: "Indore", latitude: 22.719568, longitude: 75.857727, population: 3201697, is_capital: false, city_type: "tier1" },
  { name: "Thane", state: "Maharashtra", state_code: "MH", district: "Thane", latitude: 19.21833, longitude: 72.978088, population: 2473000, is_capital: false, city_type: "tier1" },
  { name: "Bhopal", state: "Madhya Pradesh", state_code: "MP", district: "Bhopal", latitude: 23.259933, longitude: 77.412615, population: 2364000, is_capital: true, city_type: "tier1" },
  { name: "Visakhapatnam", state: "Andhra Pradesh", state_code: "AP", district: "Visakhapatnam", latitude: 17.686816, longitude: 83.218482, population: 2329000, is_capital: false, city_type: "tier1" },

  { name: "Ghaziabad", state: "Uttar Pradesh", state_code: "UP", district: "Ghaziabad", latitude: 28.669862, longitude: 77.45356, population: 2375820, is_capital: false, city_type: "tier2" },
  { name: "Agra", state: "Uttar Pradesh", state_code: "UP", district: "Agra", latitude: 27.17667, longitude: 78.00808, population: 1760285, is_capital: false, city_type: "tier2" },
  { name: "Nashik", state: "Maharashtra", state_code: "MH", district: "Nashik", latitude: 19.997454, longitude: 73.789803, population: 1562769, is_capital: false, city_type: "tier2" },
  { name: "Meerut", state: "Uttar Pradesh", state_code: "UP", district: "Meerut", latitude: 28.984461, longitude: 77.706413, population: 1424826, is_capital: false, city_type: "tier2" },
  { name: "Varanasi", state: "Uttar Pradesh", state_code: "UP", district: "Varanasi", latitude: 25.317645, longitude: 82.973915, population: 1432280, is_capital: false, city_type: "tier2" },

  { name: "Mysuru", state: "Karnataka", state_code: "KA", district: "Mysuru", latitude: 12.29581, longitude: 76.639381, population: 920550, is_capital: false, city_type: "tier3" },
  { name: "Gurgaon", state: "Haryana", state_code: "HR", district: "Gurugram", latitude: 28.459497, longitude: 77.026634, population: 876824, is_capital: false, city_type: "tier3" },
  { name: "Noida", state: "Uttar Pradesh", state_code: "UP", district: "Gautam Buddha Nagar", latitude: 28.535517, longitude: 77.391029, population: 642381, is_capital: false, city_type: "tier3" },
  { name: "Dehradun", state: "Uttarakhand", state_code: "UK", district: "Dehradun", latitude: 30.316496, longitude: 78.032188, population: 578420, is_capital: true, city_type: "tier3" },
];

const seedCities = async () => {
  try {
    const count = await City.count();

    if (count > 0) {
      console.log("⚠️ Cities already exist, skipping...");
      return;
    }

    await City.bulkCreate(cities);

    console.log("✅ Cities seeded successfully");
  } catch (error) {
    console.error("❌ City seeder error:", error.message);
  }
};

export default seedCities;