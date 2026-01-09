# -*- coding: utf-8 -*-
"""
ColdMail 크롤러 설정
"""
import os
from dotenv import load_dotenv

# .env 파일 로드 (프로젝트 루트)
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env.local'))

# Supabase 설정
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

# Gemini 설정
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

# 크롤링 설정
CRAWL_DELAY = 3  # 요청 간 딜레이 (초)
MAX_RETRIES = 3  # 최대 재시도 횟수
DAILY_LIMIT = 200  # 일일 수집 한도

# 수집 소스
SOURCES = {
    'saramin': {
        'name': '사람인',
        'enabled': True,
        'base_url': 'https://www.saramin.co.kr',
    },
    'rocketpunch': {
        'name': '로켓펀치',
        'enabled': True,
        'base_url': 'https://www.rocketpunch.com',
    },
    'wanted': {
        'name': '원티드',
        'enabled': True,
        'base_url': 'https://www.wanted.co.kr',
    },
}

# User-Agent (차단 방지)
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
]

# 로그 설정
LOG_DIR = os.path.join(os.path.dirname(__file__), 'logs')
os.makedirs(LOG_DIR, exist_ok=True)
