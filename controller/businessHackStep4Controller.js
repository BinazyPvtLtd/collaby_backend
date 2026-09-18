import { mutateStep } from "./campaignWorkflow.controller.js";
import BusinessHackStep4 from '../models/BusinessHackStep4.js'
import BusinessHack from '../models/BusinessHacks.js'
import multer from 'multer'
import fs from 'fs'

const BASE_URL = 'http://13.201.88.246:5000'

// 🔧 Format single file path
const formatFileUrl = filePath => {
  if (!filePath) return null

  // already full URL → don't modify
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath
  }

  // convert \ → /
  const cleanPath = filePath.replace(/\\/g, '/')

  // remove leading slash if exists (avoid double //)
  const finalPath = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath

  return `${BASE_URL}/${finalPath}`
}

// 🔧 Format full response
const formatResponse = data => {
  if (!data) return data

  const obj = data.toJSON ? data.toJSON() : data

  return {
    ...obj,
    campaignImage: formatFileUrl(obj.campaignImage),
    sampleMedia: Array.isArray(obj.sampleMedia)
      ? obj.sampleMedia.map(formatFileUrl)
      : []
  }
}


// helper (safe delete)
const safeDelete = filePath => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (err) {
    console.log('Delete error:', err.message)
  }
}


export const createBusinessHackStep4 = mutateStep(4, "create");

// ✅ GET ALL
export const getAllBusinessHackStep4 = async (req, res) => {
  try {
    const data = await BusinessHackStep4.findAll({
      where: {
        user_id: req.user.userId
      },
      include: {
        model: BusinessHack,
        where: {
          user_id: req.user.userId
        }
      }
    })
    const formatted = data.map(formatResponse)

    res.status(200).json({
      success: true,
      data: formatted
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

export const updateBusinessHackStep4 = mutateStep(4, "update");
export const deleteBusinessHackStep4 = mutateStep(4, "delete");
