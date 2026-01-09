# -*- coding: utf-8 -*-
"""
Supabase 저장 모듈
- Python 3.14 호환을 위해 SDK 대신 HTTP API 직접 호출
"""
import requests

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import SUPABASE_URL, SUPABASE_KEY


class SupabaseStorage:
    def __init__(self):
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("Supabase 설정이 없습니다. .env.local 파일을 확인하세요.")
        self.base_url = f"{SUPABASE_URL}/rest/v1"
        self.headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    def _request(self, method, endpoint, data=None, params=None):
        """HTTP 요청 헬퍼"""
        url = f"{self.base_url}/{endpoint}"
        response = requests.request(
            method=method,
            url=url,
            headers=self.headers,
            json=data,
            params=params,
            timeout=30
        )
        if response.status_code >= 400:
            print(f"Supabase 오류: {response.status_code} - {response.text}")
            return None
        try:
            return response.json() if response.text else []
        except:
            return []

    def save_company(self, company_data):
        """
        기업 정보 저장 (중복 체크 후 INSERT/UPDATE)
        """
        # 기존 기업 확인 (이름으로 중복 체크)
        existing = self._request(
            'GET',
            'companies',
            params={'name': f"eq.{company_data['name']}", 'select': 'id'}
        )

        if existing and len(existing) > 0:
            # 업데이트
            company_id = existing[0]['id']
            self._request(
                'PATCH',
                f"companies?id=eq.{company_id}",
                data=company_data
            )
            return {'id': company_id, 'action': 'updated'}
        else:
            # 새로 추가
            result = self._request('POST', 'companies', data=company_data)
            if result and len(result) > 0:
                return {'id': result[0]['id'], 'action': 'inserted'}
            return {'id': None, 'action': 'failed'}

    def save_contact(self, company_id, contact_data):
        """
        연락처 정보 저장 (company_contacts 테이블)
        """
        contact_data['company_id'] = company_id

        # 이메일로 중복 체크
        if contact_data.get('email'):
            existing = self._request(
                'GET',
                'company_contacts',
                params={'email': f"eq.{contact_data['email']}", 'select': 'id'}
            )

            if existing and len(existing) > 0:
                self._request(
                    'PATCH',
                    f"company_contacts?id=eq.{existing[0]['id']}",
                    data=contact_data
                )
                return {'action': 'updated'}

        self._request('POST', 'company_contacts', data=contact_data)
        return {'action': 'inserted'}

    def log_collection(self, source, total, success, fail, status='completed'):
        """
        수집 로그 저장
        """
        self._request('POST', 'collection_logs', data={
            'source': source,
            'total_count': total,
            'success_count': success,
            'fail_count': fail,
            'status': status,
        })

    def get_industries(self):
        """
        업종 목록 조회
        """
        result = self._request('GET', 'industries', params={'select': '*'})
        return result or []

    def check_duplicate(self, name, website=None):
        """
        기업 중복 확인
        """
        params = {'select': 'id,name'}

        if website:
            params['or'] = f"(name.eq.{name},website.eq.{website})"
        else:
            params['name'] = f"eq.{name}"

        result = self._request('GET', 'companies', params=params)
        return len(result) > 0 if result else False

    def get_crawler_state(self, source):
        """
        크롤러 상태 조회 (마지막 페이지 등)
        """
        result = self._request(
            'GET',
            'settings',
            params={'key': f"eq.crawler_{source}", 'select': '*'}
        )
        if result and len(result) > 0:
            return result[0].get('value', {})
        return {'last_page': 0}

    def save_crawler_state(self, source, state):
        """
        크롤러 상태 저장
        """
        key = f"crawler_{source}"
        existing = self._request(
            'GET',
            'settings',
            params={'key': f"eq.{key}", 'select': 'id'}
        )

        if existing and len(existing) > 0:
            self._request(
                'PATCH',
                f"settings?key=eq.{key}",
                data={'value': state}
            )
        else:
            self._request('POST', 'settings', data={
                'key': key,
                'value': state
            })
