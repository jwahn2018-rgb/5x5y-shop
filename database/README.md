# 데이터베이스 설정 가이드

**참고**: 데이터베이스는 별도 서버에 있으며, 쿠버네티스에 배포되지 않습니다.

## 방법 1: SSH로 직접 접속하여 실행 (로컬에 MySQL 클라이언트 없을 때)

### 1단계: SSH 접속
```bash
ssh -i "%KEY%" -p 222 5x5yghk@hmsite.iptime.org
```

### 2단계: setup-database.sql 파일 업로드
로컬에서 원격 서버로 파일 전송:
```bash
# 새 터미널에서 (SSH 접속 전)
scp -i "%KEY%" -P 222 database/setup-database.sql 5x5yghk@hmsite.iptime.org:~/
```

### 3단계: MySQL 실행 및 스크립트 실행
SSH 접속한 서버에서:
```bash
sudo mysql < ~/setup-database.sql
```

또는 MySQL에 접속한 후:
```bash
sudo mysql
# MySQL 프롬프트에서
source ~/setup-database.sql
```

### 또는 복사-붙여넣기 방법
1. SSH로 서버 접속
2. `sudo mysql` 실행
3. `setup-database.sql` 파일 내용을 복사
4. MySQL 프롬프트에 붙여넣기

## 방법 2: SSH 터널링 사용 (로컬에 MySQL 클라이언트 있을 때)

### 1단계: SSH 터널링 실행
```bash
# 프로젝트 루트에서 실행
ssh-tunnel.bat
```

### 2단계: 로컬에서 MySQL 클라이언트로 접속
새 터미널에서:
```bash
mysql -h 127.0.0.1 -P 13306 -u root -p < database/setup-database.sql
```

## 3. 연결 테스트 (로컬 개발 환경)

로컬에서 백엔드 연결 테스트:
```bash
cd backend
npm install
node src/test-connection.js
```

**주의**: 백엔드 `.env` 파일 설정:
- `DB_HOST=localhost` (SSH 터널링 사용 시)
- `DB_PORT=13306`
- `DB_USER=web`
- `DB_PASSWORD=5x5yghkdlxld`
- `DB_NAME=shopdb`

## 주의사항

- `setup-database.sql`은 기존 데이터를 모두 삭제합니다
- 계정 생성은 root 권한이 필요합니다
- SSH 터널링 방법은 개발 시에만 사용 (프로덕션은 직접 연결)
