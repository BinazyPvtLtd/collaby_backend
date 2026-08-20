import multer from 'multer'
import path from 'path'
import fs from 'fs'

// ==========================================================
// ENSURE UPLOAD DIRECTORY EXISTS
// ==========================================================

const uploadDir = 'uploads/campaigns'

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true
  })
}

// ==========================================================
// STORAGE
// ==========================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase()

    const uniqueName = `${file.fieldname}-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${extension}`

    cb(null, uniqueName)
  }
})

// ==========================================================
// FILE FILTER
// ==========================================================

const imageMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif'
]

const imageExtensions = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.heic',
  '.heif'
]

const videoMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime']

const videoExtensions = ['.mp4', '.webm', '.mov']

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase()

  console.log('📁 Upload file:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    extension
  })

  const imageExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.gif',
    '.heic',
    '.heif'
  ]

  const videoExtensions = ['.mp4', '.webm', '.mov']

  // ==========================================================
  // campaignImage → ONLY IMAGE
  // ==========================================================

  if (file.fieldname === 'campaignImage') {
    const isValidImage = imageExtensions.includes(extension)

    if (isValidImage) {
      return cb(null, true)
    }

    return cb(
      new Error(
        `campaignImage must be a valid image. Received extension: ${extension}`
      )
    )
  }

  // ==========================================================
  // sampleMedia → IMAGE OR VIDEO
  // ==========================================================

  if (file.fieldname === 'sampleMedia') {
    const isValidImage = imageExtensions.includes(extension)

    const isValidVideo = videoExtensions.includes(extension)

    if (isValidImage || isValidVideo) {
      return cb(null, true)
    }

    return cb(
      new Error(`Invalid sampleMedia type. Received extension: ${extension}`)
    )
  }

  return cb(new Error(`Unexpected file field: ${file.fieldname}`))
}
// ==========================================================
// MULTER CONFIG
// ==========================================================

const uploadStep4 = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024
  }
}).fields([
  {
    name: 'campaignImage',
    maxCount: 1
  },
  {
    name: 'sampleMedia',
    maxCount: 10
  }
])

export default uploadStep4
