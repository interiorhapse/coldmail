# -*- coding: utf-8 -*-
"""
AI 파싱 모듈 (Gemini)
웹페이지 텍스트에서 연락처 정보 추출
- Python 3.14 호환을 위해 SDK 대신 HTTP API 직접 호출
"""
import re
import json
import requests

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import GEMINI_API_KEY


class AIParser:
    def __init__(self):
        if not GEMINI_API_KEY:
            raise ValueError("Gemini API 키가 없습니다.")
        self.api_key = GEMINI_API_KEY
        self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key={self.api_key}"

    def extract_contacts(self, text, company_name=None):
        """
        텍스트에서 연락처 정보 추출
        """
        # 텍스트가 너무 길면 잘라냄
        if len(text) > 10000:
            text = text[:10000]

        prompt = f"""다음 웹페이지 내용에서 연락처 정보를 추출해주세요.

회사명: {company_name or '알 수 없음'}

추출할 정보:
1. 담당자 이름
2. 직책/직급
3. 이메일 주소
4. 전화번호

우선순위:
- 마케팅/영업/사업개발 담당자 > 채용담당자 > 대표/CEO > info@

JSON 형식으로 응답해주세요:
{{
    "contacts": [
        {{
            "name": "이름 또는 null",
            "title": "직책 또는 null",
            "email": "이메일 또는 null",
            "phone": "전화번호 또는 null",
            "department": "부서 또는 null"
        }}
    ],
    "company_email": "회사 대표 이메일 (info@, contact@ 등)",
    "company_phone": "회사 대표 전화번호"
}}

연락처를 찾을 수 없으면 빈 배열을 반환하세요.

---
웹페이지 내용:
{text}
"""

        try:
            response = requests.post(
                self.api_url,
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": 0.1,
                        "maxOutputTokens": 2048,
                    }
                },
                timeout=60
            )

            if response.status_code != 200:
                print(f"Gemini API 오류: {response.status_code} - {response.text}")
                return {'contacts': [], 'company_email': None, 'company_phone': None}

            result = response.json()
            result_text = result['candidates'][0]['content']['parts'][0]['text']

            # JSON 파싱
            json_match = re.search(r'\{[\s\S]*\}', result_text)
            if json_match:
                return json.loads(json_match.group())

            return {'contacts': [], 'company_email': None, 'company_phone': None}
        except Exception as e:
            print(f"AI 파싱 오류: {e}")
            return {'contacts': [], 'company_email': None, 'company_phone': None}

    def extract_with_regex(self, text):
        """
        정규식으로 기본 정보 추출 (AI 호출 전 빠른 추출)
        """
        result = {
            'emails': [],
            'phones': [],
        }

        # 이메일 패턴
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        emails = re.findall(email_pattern, text)
        # 필터링 (이미지, 예시 등 제외)
        result['emails'] = [
            e for e in set(emails)
            if not any(x in e.lower() for x in ['example', 'test', '.png', '.jpg', 'noreply'])
        ]

        # 전화번호 패턴 (한국)
        phone_patterns = [
            r'02-\d{3,4}-\d{4}',  # 서울
            r'0\d{1,2}-\d{3,4}-\d{4}',  # 지역번호
            r'010-\d{4}-\d{4}',  # 휴대폰
            r'070-\d{4}-\d{4}',  # 인터넷전화
        ]
        for pattern in phone_patterns:
            phones = re.findall(pattern, text)
            result['phones'].extend(phones)

        result['phones'] = list(set(result['phones']))

        return result
