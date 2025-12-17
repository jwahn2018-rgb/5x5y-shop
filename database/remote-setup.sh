#!/bin/bash
# 원격 서버에서 직접 실행하는 스크립트
# 사용법: SSH로 접속 후 이 스크립트를 서버에 업로드하고 실행

echo "데이터베이스 초기화 시작..."

# shopdb 데이터베이스 선택
mysql -u root -p <<EOF
$(cat setup-database.sql)
EOF

echo "데이터베이스 초기화 완료!"

