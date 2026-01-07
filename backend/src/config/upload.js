import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { randomUUID } from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 업로드 디렉토리 설정 (NFS 마운트 경로 또는 로컬 경로)
// 환경변수로 설정 가능, 기본값은 uploads 폴더
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads')
const FILE_SERVER_URL = process.env.FILE_SERVER_URL || 'http://localhost:5000/uploads'

// 업로드 디렉토리가 없으면 생성
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

// 상품 이미지 저장 경로 구조: /images/{partner_id}/{product_id}/{filename}
export const getProductImagePath = (partnerId, productId, filename) => {
  return path.join(UPLOAD_DIR, 'images', String(partnerId), String(productId), filename)
}

// 상품 이미지 디렉토리 생성
export const ensureProductImageDir = (partnerId, productId) => {
  const dir = path.join(UPLOAD_DIR, 'images', String(partnerId), String(productId))
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

// 임시 업로드 디렉토리 (상품 생성 전)
const TEMP_UPLOAD_DIR = path.join(UPLOAD_DIR, 'temp')
if (!fs.existsSync(TEMP_UPLOAD_DIR)) {
  fs.mkdirSync(TEMP_UPLOAD_DIR, { recursive: true })
}

// Multer 설정 - 임시 업로드용
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_UPLOAD_DIR)
  },
  filename: (req, file, cb) => {
    // UUID로 파일명 생성
    const uuid = randomUUID()
    const ext = path.extname(file.originalname)
    cb(null, `${uuid}${ext}`)
  }
})

// 파일 필터 (이미지만 허용)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
  const mimetype = allowedTypes.test(file.mimetype)

  if (mimetype && extname) {
    return cb(null, true)
  } else {
    cb(new Error('이미지 파일만 업로드 가능합니다. (jpeg, jpg, png, gif, webp)'))
  }
}

// Multer 인스턴스 생성 (임시 업로드용)
export const upload = multer({
  storage: tempStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 제한
  },
  fileFilter: fileFilter
})

// 정적 파일 서빙을 위한 경로 반환
export const getUploadPath = () => UPLOAD_DIR
export const getFileServerUrl = () => FILE_SERVER_URL
export const getTempUploadDir = () => TEMP_UPLOAD_DIR

// 임시 파일을 최종 경로로 이동
export const moveTempFileToProduct = (tempFilename, partnerId, productId) => {
  const tempPath = path.join(TEMP_UPLOAD_DIR, tempFilename)
  const ext = path.extname(tempFilename)
  const finalFilename = `${randomUUID()}${ext}`
  const finalDir = ensureProductImageDir(partnerId, productId)
  const finalPath = path.join(finalDir, finalFilename)
  
  fs.renameSync(tempPath, finalPath)
  return finalFilename
}

// 이미지 URL 생성
export const getImageUrl = (partnerId, productId, filename) => {
  const fileServerUrl = getFileServerUrl()
  return `${fileServerUrl}/images/${partnerId}/${productId}/${filename}`
}
