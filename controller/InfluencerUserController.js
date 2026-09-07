import influencersUser from "../models/InfluencerUser.js";
import BusinessRegistration from "../models/Business.js";
import identityService from "../services/identity.service.js";
import sequelize from "../config/database.js";
import { Op } from "sequelize";
import { convertToString } from "../HelperFunction/Helper.js";
import { generateAccessToken, generateRefreshToken } from "../HelperFunction/Tokens.js";

const profileFields = ["fullName", "mobileNumber", "email", "dob", "city", "gender"];
const safeFields = ["id", ...profileFields, "createdAt", "updatedAt"];
const safePayload = (record) => Object.fromEntries(
  safeFields.map((field) => [field, record.get(field)]),
);

const fail = (res, status, message) => res.status(status).json({ success: false, message });
const handleError = (res, error) => {
  if (error.name === "SequelizeUniqueConstraintError") {
    return fail(res, 409, "Mobile number or email is already registered");
  }
  if (error.name === "SequelizeValidationError") {
    return fail(res, 400, error.errors.map((item) => item.message).join(", "));
  }
  console.error("Influencer account operation failed:", error.name);
  return fail(res, 500, "Unable to process influencer account request");
};

const validateProfile = (body, partial = false) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be an object" };
  }
  if (partial && Object.keys(body).some((key) => !profileFields.includes(key))) {
    return { error: "Only profile fields can be updated" };
  }
  const data = {};
  for (const field of profileFields) {
    if (partial && !Object.hasOwn(body, field)) continue;
    if (typeof body[field] !== "string" || !body[field].trim()) {
      return { error: `${field} must be a non-empty string` };
    }
    data[field] = body[field].trim();
  }
  if (!Object.keys(data).length) return { error: "Provide at least one profile field" };
  if (data.mobileNumber && !/^[6-9]\d{9}$/.test(data.mobileNumber)) {
    return { error: "Mobile number must be a valid 10-digit Indian number" };
  }
  if (data.email) data.email = data.email.toLowerCase();
  if (data.gender) {
    data.gender = data.gender[0].toUpperCase() + data.gender.slice(1).toLowerCase();
    if (!["Male", "Female", "Other"].includes(data.gender)) return { error: "Invalid gender value" };
  }
  if (data.dob) {
    const date = new Date(data.dob);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.dob) || Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== data.dob || data.dob >= new Date().toISOString().slice(0, 10)) {
      return { error: "dob must be a valid past date in YYYY-MM-DD format" };
    }
  }
  return { data };
};

const hasAccess = (req, influencer) => Boolean(req.admin) ||
  (req.user?.userType === "influencer" && String(req.user.userId) === String(influencer.id));
const validId = (id) => /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id)) && Number(id) <= 2147483647;

const duplicateExists = async (data, id) => {
  if (data.mobileNumber && await BusinessRegistration.findOne({ where: { mobileNumber: data.mobileNumber } })) {
    return true;
  }
  const matches = ["mobileNumber", "email"].filter((key) => data[key]).map((key) => ({ [key]: data[key] }));
  if (!matches.length) return false;
  return Boolean(await influencersUser.findOne({
    where: { [Op.or]: matches, ...(id ? { id: { [Op.ne]: id } } : {}) },
    paranoid: false,
  }));
};

export const createInfluencer = async (req, res) => {
  try {
    const { data, error } = validateProfile(req.body);
    if (error) return fail(res, 400, error);
    if (await duplicateExists(data)) return fail(res, 409, "Mobile number or email is already registered");
    const result = await sequelize.transaction(async (transaction) => {
      const influencer = await influencersUser.create(data, { transaction });
      const identity = await identityService.resolve({ userId: influencer.id, userType: "influencer" }, { transaction });
      const payload = { identityId: identity.id, userId: influencer.id, userType: "influencer" };
      return {
        ...convertToString(safePayload(influencer)),
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
      };
    });
    return res.status(201).json({ success: true, message: "Influencer created successfully", data: result });
  } catch (error) { return handleError(res, error); }
};

export const getAllInfluencers = async (req, res) => {
  try {
    const page = req.query.page ?? "1";
    const limit = req.query.limit ?? "20";
    if (typeof page !== "string" || typeof limit !== "string" || !validId(page) || !validId(limit) || Number(limit) > 100) {
      return fail(res, 400, "page must be a positive integer and limit must be between 1 and 100");
    }
    const { search, gender } = req.query;
    if (search !== undefined && (typeof search !== "string" || search.trim().length > 150)) {
      return fail(res, 400, "search must be a string of at most 150 characters");
    }
    if (gender !== undefined && !["Male", "Female", "Other"].includes(gender)) {
      return fail(res, 400, "Invalid gender value");
    }
    const where = {};
    if (search?.trim()) {
      where[Op.or] = ["fullName", "email", "mobileNumber"].map((field) => ({
        [field]: { [Op.substring]: search.trim() },
      }));
    }
    if (gender) where.gender = gender;
    const { rows, count } = await influencersUser.findAndCountAll({
      where, attributes: safeFields, order: [["id", "DESC"]], limit: Number(limit), offset: (Number(page) - 1) * Number(limit),
    });
    return res.status(200).json({ success: true, data: rows.map(safePayload),
      pagination: { total: count, page: Number(page), limit: Number(limit), totalPages: Math.ceil(count / Number(limit)) } });
  } catch (error) { return handleError(res, error); }
};

export const getInfluencerById = async (req, res) => {
  try {
    if (!validId(req.params.id)) return fail(res, 400, "Invalid influencer ID");
    if (!hasAccess(req, { id: req.params.id })) return fail(res, 403, "Access denied");
    const influencer = await influencersUser.findByPk(req.params.id, { attributes: safeFields });
    if (!influencer) return fail(res, 404, "Influencer not found");
    return res.status(200).json({ success: true, data: safePayload(influencer) });
  } catch (error) { return handleError(res, error); }
};

export const updateInfluencer = async (req, res) => {
  try {
    if (!validId(req.params.id)) return fail(res, 400, "Invalid influencer ID");
    if (!hasAccess(req, { id: req.params.id })) return fail(res, 403, "Access denied");
    const { data, error } = validateProfile(req.body, true);
    if (error) return fail(res, 400, error);
    const influencer = await influencersUser.findByPk(req.params.id);
    if (!influencer) return fail(res, 404, "Influencer not found");
    if (await duplicateExists(data, influencer.id)) return fail(res, 409, "Mobile number or email is already registered");
    await influencer.update(data, { fields: profileFields });
    return res.status(200).json({ success: true, data: safePayload(influencer) });
  } catch (error) { return handleError(res, error); }
};

export const deleteInfluencerByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    if (!/^[6-9]\d{9}$/.test(phone)) return fail(res, 400, "Invalid phone number");
    if (!req.admin && req.influencerAccount?.mobileNumber !== phone) return fail(res, 403, "Access denied");
    const influencer = await influencersUser.findOne({ where: { mobileNumber: phone } });
    if (!influencer) return fail(res, 404, "Influencer not found");
    if (!hasAccess(req, influencer)) return fail(res, 403, "Access denied");
    await influencer.destroy();
    return res.status(200).json({ success: true, message: "Influencer deleted successfully" });
  } catch (error) { return handleError(res, error); }
};
