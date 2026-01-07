-- web 계정 확인 및 생성 스크립트

-- 계정 확인
SELECT user, host FROM mysql.user WHERE user = 'web';

-- 계정이 없으면 생성
CREATE USER IF NOT EXISTS 'web'@'%' IDENTIFIED BY '5x5yghkdlxld';

-- 권한 부여
GRANT ALL PRIVILEGES ON shopdb.* TO 'web'@'%';

-- 권한 새로고침
FLUSH PRIVILEGES;

-- 다시 확인
SELECT user, host FROM mysql.user WHERE user = 'web';

