import mysql from 'mysql2/promise'
// dotenv.config() 제거 - Kubernetes Secret으로 환경변수 관리

// 환경변수에서 읽기/쓰기 호스트 가져오기
const getReadHosts = () => {
  const readHost = process.env.DB_READ_HOST || process.env.DB_HOST || 'localhost'
  // 쉼표로 구분된 여러 호스트 지원
  return readHost.split(',').map(h => h.trim())
}

const getWriteHost = () => {
  return process.env.DB_WRITE_HOST || process.env.DB_HOST || 'localhost'
}

// 읽기/쓰기 포트 분리 지원
const getReadPort = () => {
  return parseInt(process.env.DB_READ_PORT) || parseInt(process.env.DB_PORT) || 3306
}

const getWritePort = () => {
  return parseInt(process.env.DB_WRITE_PORT) || parseInt(process.env.DB_PORT) || 3306
}

// DB 연결 설정 로그 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  console.log('DB Connection Config:', {
    readHosts: getReadHosts(),
    readPort: getReadPort(),
    writeHost: getWriteHost(),
    writePort: getWritePort(),
    user: process.env.DB_USER || 'root',
    database: process.env.DB_NAME || 'shopdb',
    password: process.env.DB_PASSWORD ? '***' : '(not set)'
  })
}

// 연결 설정 생성 함수
const getConnectionConfig = (host, port) => ({
  host: host,
  port: port,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'shopdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 10000, // 10초 연결 타임아웃
  acquireTimeout: 10000, // 10초 연결 획득 타임아웃
  timeout: 30000 // 30초 쿼리 타임아웃
})

// 읽기용 풀 생성 (로드밸런싱: 첫 번째 호스트 사용)
// 여러 호스트가 있으면 첫 번째를 사용하고, 필요시 확장 가능
const readHosts = getReadHosts()
const readPool = mysql.createPool(getConnectionConfig(readHosts[0], getReadPort()))

// 쓰기용 풀 생성
const writeHost = getWriteHost()
const writePool = mysql.createPool(getConnectionConfig(writeHost, getWritePort()))

// 연결 테스트를 비동기로 실행 (실패해도 애플리케이션은 계속 실행)
// 실제 사용 시점에 연결 풀이 자동으로 재시도함
const testConnections = async () => {
  try {
    const [readConn, writeConn] = await Promise.all([
      readPool.getConnection(),
      writePool.getConnection()
    ])
    readConn.release()
    writeConn.release()
    console.log(`✅ Database connection successful! (read: ${readHosts[0]}:${getReadPort()}, write: ${writeHost}:${getWritePort()})`)
  } catch (error) {
    console.error('❌ Database connection test failed:', error.message)
    console.error('Connection will be retried on first use.')
    // 연결 테스트 실패해도 애플리케이션은 계속 실행
    // 실제 사용 시점에 연결 풀이 자동으로 재시도함
  }
}

// 비동기로 연결 테스트 실행 (블로킹하지 않음)
testConnections().catch(() => {
  // 무시 - 연결 테스트 실패해도 애플리케이션은 계속 실행
})

// 쿼리가 읽기인지 쓰기인지 판단하는 헬퍼 함수
export const isReadQuery = (sql) => {
  const trimmed = sql.trim().toUpperCase()
  return trimmed.startsWith('SELECT') || 
         trimmed.startsWith('SHOW') || 
         trimmed.startsWith('DESCRIBE') ||
         trimmed.startsWith('EXPLAIN')
}

// 트랜잭션을 위한 연결 가져오기 (항상 쓰기 풀 사용)
export const getTransactionConnection = async () => {
  return await writePool.getConnection()
}

// 읽기/쓰기 자동 선택 풀
export const getPool = (sql) => {
  return isReadQuery(sql) ? readPool : writePool
}

// 기본 export는 쓰기 풀 (하위 호환성)
export default writePool

// 명시적 export
export { readPool, writePool }