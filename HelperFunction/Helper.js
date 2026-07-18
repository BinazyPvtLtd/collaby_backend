export const convertToString = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(convertToString);
  }

  if (obj !== null && typeof obj === "object") {
    const newObj = {};
    for (let key in obj) {
      newObj[key] = convertToString(obj[key]);
    }
    return newObj;
  }

  return obj !== null && obj !== undefined ? String(obj) : "";
};

export const convertIdToString = (data) => {
  // Handle null/undefined
  if (!data) return data;

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => convertIdToString(item));
  }

  // Support BOTH:
  // Sequelize instance AND raw object
  const obj = typeof data.toJSON === "function" ? data.toJSON() : { ...data };

  Object.keys(obj).forEach((key) => {
    if (typeof obj[key] === "number") {
      obj[key] = obj[key].toString();
    }
  });

  return obj;
};
export const convertIdToStringHacks = (list) => {
  if (!list) return [];

  if (Array.isArray(list)) {
    return list.map((item) => ({
      ...item.dataValues,
      id: String(item.dataValues.id),
      likes: String(item.dataValues.likes),
      views: String(item.dataValues.views),
    }));
  }

  return {
    ...list.dataValues,
    id: String(list.dataValues.id),
    likes: String(list.dataValues.likes),
    views: String(list.dataValues.views),
  };
};

export const convertIdToStringBusiness = (list) => {
  if (Array.isArray(list)) {
    return list.map((item) => ({
      ...item.dataValues,
      id: String(item.dataValues.id),
    }));
  }

  return {
    ...list.dataValues,
    id: String(list.dataValues.id),
  };
};

export const normalizeGender = (gender) => {
  const allowed = ["Male", "Female", "Other", "All"];

  // If already array
  if (Array.isArray(gender)) {
    return gender.filter((g) => allowed.includes(g));
  }

  // If object (checkbox case)
  if (typeof gender === "object" && gender !== null) {
    return Object.keys(gender).filter(
      (key) => gender[key] === true && allowed.includes(key),
    );
  }

  return [];
};

const BASE_URL = "http://localhost:5000"; // change port if needed

export const formatImagePath = (filePath) => {
  if (!filePath) return null;

  // 1. Convert backslashes to forward slashes
  let cleanPath = filePath.replace(/\\/g, "/");

  // 2. Remove leading slash (to avoid //)
  cleanPath = cleanPath.replace(/^\/+/, "");

  // 3. Return full URL
  return `${BASE_URL}/${cleanPath}`;
};

//parsing arrays from form data (comma separated or JSON string)
export const parseArray = (field) => {
  if (!field) return [];
  if (Array.isArray(field)) return field;

  if (typeof field === "string" && !field.startsWith("[")) {
    return field.split(",").map((item) => item.trim());
  }

  try {
    return JSON.parse(field);
  } catch {
    return [];
  }
};
// Format gender
export const formatGender = (gender) => {
  if (!gender) return null;

  const formatted =
    gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();

  const valid = ["Male", "Female", "Other"];
  return valid.includes(formatted) ? formatted : null;
};
