import { config } from 'dotenv';
config({ path: '.env.local' });

import { initializeDb } from './lib/db.js';

async function init() {
  console.log('PostgreSQL(Supabase) 데이터베이스 자동 생성 중...');
  try {
    await initializeDb();
    console.log('✅ 테이블 생성 및 초기 설정이 완료되었습니다.');
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error);
  }
  process.exit();
}

init();
