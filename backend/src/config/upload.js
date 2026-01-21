import { S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'
import path from 'path'

// AWS 설정
const AWS_REGION = process.env.AWS_REGION || 'ap-northeast-2'
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'usinsa-shop-images'
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN || 'img.usinsa.minn.my'
const PRESIGNED_URL_EXPIRES_IN = parseInt(process.env.PRESIGNED_URL_EXPIRES_IN) || 300 // 5분 기본값

// S3 클라이언트 초기화
// EKS: IRSA를 통해 자동으로 자격증명 획득
// 온프레미스: 환경변수에서 Access Key 사용
const s3Client = new S3Client({
  region: AWS_REGION,
  // IRSA 또는 환경변수 자격증명 자동 사용
})

// 이미지 파일 확장자 검증
const ALLOWED_EXTENSIONS = /\.(jpeg|jpg|png|gif|webp)$/i
const ALLOWED_MIME_TYPES = /^image\/(jpeg|jpg|png|gif|webp)$/i

export const validateImageFile = (filename, mimetype) => {
  const extname = path.extname(filename).toLowerCase()
  const isValidExt = ALLOWED_EXTENSIONS.test(extname)
  const isValidMime = ALLOWED_MIME_TYPES.test(mimetype)
  
  if (!isValidExt || !isValidMime) {
    throw new Error('이미지 파일만 업로드 가능합니다. (jpeg, jpg, png, gif, webp)')
  }
  
  return true
}

// S3 객체 키 생성 (경로 구조: uploads/{partner_id}/{product_id}/{uuid}.{ext})
export const generateS3Key = (partnerId, productId, originalFilename) => {
  const ext = path.extname(originalFilename).toLowerCase()
  const uuid = randomUUID()
  return `uploads/${partnerId}/${productId}/${uuid}${ext}`
}

// Presigned URL 생성 (업로드용)
export const generatePresignedUploadUrl = async (partnerId, productId, originalFilename, contentType) => {
  // 파일 검증
  validateImageFile(originalFilename, contentType)
  
  // S3 키 생성
  const key = generateS3Key(partnerId, productId, originalFilename)
  
  // Presigned URL 생성
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    // ACL 설정하지 않음 (Bucket owner enforced 사용, s3:PutObjectAcl 권한 불필요)
  })
  
  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: PRESIGNED_URL_EXPIRES_IN,
  })
  
  return {
    presignedUrl,
    key,
    url: `https://${CLOUDFRONT_DOMAIN}/${key}` // 최종 접근 URL (CloudFront)
  }
}

// Presigned URL 생성 (다중 업로드용)
export const generatePresignedUploadUrls = async (partnerId, productId, files) => {
  const results = await Promise.all(
    files.map(async (file) => {
      try {
        return await generatePresignedUploadUrl(
          partnerId,
          productId,
          file.originalname || file.name,
          file.mimetype || file.type
        )
      } catch (error) {
        console.error(`Error generating presigned URL for ${file.name}:`, error)
        throw error
      }
    })
  )
  
  return results
}

// 이미지 URL 생성 (CloudFront 도메인 사용)
export const getImageUrl = (s3Key) => {
  // s3Key가 이미 전체 URL인 경우 그대로 반환
  if (s3Key.startsWith('http://') || s3Key.startsWith('https://')) {
    return s3Key
  }
  
  // CloudFront URL 생성
  return `https://${CLOUDFRONT_DOMAIN}/${s3Key}`
}

// S3 객체 삭제
export const deleteS3Object = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
    })
    
    await s3Client.send(command)
    return true
  } catch (error) {
    console.error(`Error deleting S3 object ${key}:`, error)
    throw error
  }
}

// S3 키에서 실제 파일명 추출 (UUID 부분 제거, 원본 파일명 반환은 불가능)
export const getFilenameFromKey = (key) => {
  return path.basename(key)
}

// 설정 정보 반환
export const getUploadConfig = () => ({
  bucketName: S3_BUCKET_NAME,
  region: AWS_REGION,
  cloudfrontDomain: CLOUDFRONT_DOMAIN,
  presignedUrlExpiresIn: PRESIGNED_URL_EXPIRES_IN,
})
