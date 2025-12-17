import pool from './config/database.js'

async function testConnection() {
  try {
    console.log('데이터베이스 연결 테스트 시작...\n')
    
    // 연결 테스트
    const [rows] = await pool.execute('SELECT 1 as test')
    console.log('✅ 데이터베이스 연결 성공!')
    console.log('테스트 쿼리 결과:', rows)
    
    // 데이터베이스 이름 확인
    const [dbName] = await pool.execute('SELECT DATABASE() as db_name')
    console.log('\n현재 데이터베이스:', dbName[0].db_name)
    
    // 테이블 목록 확인
    const [tables] = await pool.execute('SHOW TABLES')
    console.log('\n📋 생성된 테이블 목록:')
    if (tables.length === 0) {
      console.log('  (테이블이 없습니다. 스키마를 먼저 적용해주세요.)')
    } else {
      tables.forEach((table, index) => {
        const tableName = Object.values(table)[0]
        console.log(`  ${index + 1}. ${tableName}`)
      })
    }
    
    // 연결 종료
    await pool.end()
    console.log('\n✅ 연결 테스트 완료!')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ 데이터베이스 연결 실패:')
    console.error('에러 메시지:', error.message)
    console.error('\n확인 사항:')
    console.error('1. SSH 터널링이 실행 중인지 확인하세요 (ssh-tunnel.bat)')
    console.error('2. .env 파일의 DB 설정이 올바른지 확인하세요')
    console.error('3. MySQL 서버가 실행 중인지 확인하세요')
    process.exit(1)
  }
}

testConnection()

