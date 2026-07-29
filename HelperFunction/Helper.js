import BusinessRegistration from '../models/Business.js'
import InfluencerUser from '../models/InfluencerUser.js'
export const convertToString = value => {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return value
  }

  // Handle Date
  if (value instanceof Date) {
    return value.toISOString()
  }

  // Handle BigInt
  if (typeof value === 'bigint') {
    return value.toString()
  }

  // Handle Array
  if (Array.isArray(value)) {
    return value.map(convertToString)
  }

  // Handle Object
  if (typeof value === 'object') {
    const result = {}

    Object.keys(value).forEach(key => {
      const val = value[key]

      // Skip null fields if you don't want them in response
      if (val !== null && val !== undefined) {
        result[key] = convertToString(val)
      }
    })

    return result
  }

  return value
}

export const convertIdToString = data => {
  // Handle null/undefined
  if (!data) return data

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => convertIdToString(item))
  }

  // Support BOTH:
  // Sequelize instance AND raw object
  const obj = typeof data.toJSON === 'function' ? data.toJSON() : { ...data }

  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'number') {
      obj[key] = obj[key].toString()
    }
  })

  return obj
}
export const convertIdToStringHacks = list => {
  if (!list) return []

  if (Array.isArray(list)) {
    return list.map(item => ({
      ...item.dataValues,
      id: String(item.dataValues.id),
      likes: String(item.dataValues.likes),
      views: String(item.dataValues.views)
    }))
  }

  return {
    ...list.dataValues,
    id: String(list.dataValues.id),
    likes: String(list.dataValues.likes),
    views: String(list.dataValues.views)
  }
}

export const convertIdToStringBusiness = list => {
  if (Array.isArray(list)) {
    return list.map(item => ({
      ...item.dataValues,
      id: String(item.dataValues.id)
    }))
  }

  return {
    ...list.dataValues,
    id: String(list.dataValues.id)
  }
}

export const normalizeGender = gender => {
  const allowed = ['Male', 'Female', 'Other', 'All']

  // If already array
  if (Array.isArray(gender)) {
    return gender.filter(g => allowed.includes(g))
  }

  // If object (checkbox case)
  if (typeof gender === 'object' && gender !== null) {
    return Object.keys(gender).filter(
      key => gender[key] === true && allowed.includes(key)
    )
  }

  return []
}

const BASE_URL = 'http://localhost:5000' // change port if needed

export const formatImagePath = filePath => {
  if (!filePath) return null

  // 1. Convert backslashes to forward slashes
  let cleanPath = filePath.replace(/\\/g, '/')

  // 2. Remove leading slash (to avoid //)
  cleanPath = cleanPath.replace(/^\/+/, '')

  // 3. Return full URL
  return `${BASE_URL}/${cleanPath}`
}

//parsing arrays from form data (comma separated or JSON string)
export const parseArray = field => {
  if (!field) return []
  if (Array.isArray(field)) return field

  if (typeof field === 'string' && !field.startsWith('[')) {
    return field.split(',').map(item => item.trim())
  }

  try {
    return JSON.parse(field)
  } catch {
    return []
  }
}
// Format gender
export const formatGender = gender => {
  if (!gender) return null

  const formatted =
    gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase()

  const valid = ['Male', 'Female', 'Other']
  return valid.includes(formatted) ? formatted : null
}

// Find user by phone and type in login flow(send-otp)
export const findUserByPhoneAndType = async (phone, userType) => {
  let user = null

  if (userType === 'business') {
    user = await BusinessRegistration.findOne({
      where: {
        mobileNumber: phone
      }
    })
  } else if (userType === 'influencer') {
    user = await InfluencerUser.findOne({
      where: {
        mobileNumber: phone
      }
    })
  }

  return {
    exists: !!user,
    user,
    userType
  }
}