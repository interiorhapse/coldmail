# -*- coding: utf-8 -*-
"""
원티드 크롤러
채용공고 기반 기업 정보 및 연락처 수집
"""
import time
import random
import re
import requests
from urllib.parse import urljoin

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import CRAWL_DELAY, USER_AGENTS, MAX_RETRIES


class WantedCrawler:
    def __init__(self, start_page=0):
        self.base_url = 'https://www.wanted.co.kr'
        self.api_url = 'https://www.wanted.co.kr/api/v4'
        self.start_page = start_page
        self.last_page = start_page
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': random.choice(USER_AGENTS),
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Referer': 'https://www.wanted.co.kr/',
            'Origin': 'https://www.wanted.co.kr',
        })

    def _request(self, url, retries=0, is_json=True):
        """HTTP 요청 (재시도 로직 포함)"""
        try:
            delay = CRAWL_DELAY + random.uniform(0.5, 1.5)
            print(f"대기 {delay:.1f}초...")
            time.sleep(delay)

            response = self.session.get(url, timeout=30)
            response.raise_for_status()

            if is_json:
                return response.json()
            return response
        except Exception as e:
            if retries < MAX_RETRIES:
                print(f"재시도 {retries + 1}/{MAX_RETRIES}: {url[:60]}...")
                time.sleep(3)
                return self._request(url, retries + 1, is_json)
            print(f"요청 실패: {e}")
            return None

    def get_job_list(self, offset=0, limit=50):
        """채용공고 목록에서 기업 ID 수집"""
        companies = []
        collected_ids = set()
        current_offset = offset

        # 카테고리별 수집 (518=개발, 507=마케팅, 508=경영/비즈니스)
        categories = [518, 507, 508, 510, 512]  # 개발, 마케팅, 경영, 영업, 미디어

        for category in categories:
            if len(companies) >= limit:
                break

            # 원티드 API로 채용공고 조회
            url = f"{self.api_url}/jobs?country=kr&tag_type_ids={category}&job_sort=job.latest_order&years=-1&locations=all&offset={current_offset}&limit=20"
            print(f"[원티드] 카테고리 {category} 수집 중 (offset: {current_offset})...")

            data = self._request(url)
            if not data or 'data' not in data:
                continue

            jobs = data.get('data', [])
            print(f"[원티드] {len(jobs)}개 채용공고 발견")

            for job in jobs:
                if len(companies) >= limit:
                    break

                company_id = job.get('company', {}).get('id')
                company_name = job.get('company', {}).get('name')

                if company_id and company_id not in collected_ids:
                    collected_ids.add(company_id)
                    companies.append({
                        'company_id': company_id,
                        'name': company_name,
                        'detail_url': f"{self.base_url}/company/{company_id}",
                        'job_title': job.get('position'),
                        'job_id': job.get('id'),
                    })

            current_offset += 20

        self.last_page = current_offset // 20
        print(f"[원티드] 총 {len(companies)}개 기업 수집")
        return companies

    def get_company_detail(self, company):
        """기업 상세 정보 수집 (API)"""
        company_id = company.get('company_id')
        if not company_id:
            return company

        # 원티드 API로 기업 상세 정보 조회
        url = f"{self.api_url}/companies/{company_id}"
        print(f"  상세 정보 수집: {company.get('name')}...")

        data = self._request(url)
        if not data or 'company' not in data:
            return company

        info = data.get('company', {})

        # 기업 정보 추출
        company['name'] = info.get('name', company.get('name'))
        company['industry_text'] = info.get('industry_name', '')

        # 태그에서 추가 정보
        tags = info.get('tags', [])
        if tags:
            company['tags'] = [t.get('title') for t in tags if t.get('title')]

        # 웹사이트 (있으면)
        if info.get('link'):
            company['website'] = info.get('link')

        # 주소
        if info.get('address'):
            company['address'] = info.get('address')

        # 회사 소개
        if info.get('description'):
            company['raw_text'] = info.get('description', '')[:3000]

        # 직원 수
        if info.get('employee_count'):
            company['employee_count'] = info.get('employee_count')

        return company

    def crawl_website(self, website_url):
        """기업 웹사이트에서 연락처 수집"""
        if not website_url:
            return {}

        result = {'website_text': '', 'emails': [], 'phones': []}

        try:
            print(f"    웹사이트 크롤링: {website_url[:50]}...")
            response = self._request(website_url, is_json=False)
            if not response:
                return result

            text = response.text

            # 이메일 추출
            emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
            filtered_emails = [
                e for e in set(emails)
                if not any(x in e.lower() for x in ['example', 'test', 'noreply', 'wanted', 'wix', 'cafe24'])
            ]

            # 전화번호 추출 (한국)
            phones = re.findall(r'0\d{1,2}-\d{3,4}-\d{4}', text)

            result['emails'] = filtered_emails[:5]
            result['phones'] = list(set(phones))[:5]
            result['website_text'] = text[:2000]

        except Exception as e:
            print(f"    웹사이트 오류: {e}")

        return result

    def collect(self, keywords=None, limit=50):
        """전체 수집 프로세스"""
        all_companies = []

        print(f"[원티드] 수집 시작 (시작 offset: {self.start_page * 20}, 한도: {limit})")

        # 1. 채용공고에서 기업 목록 수집
        companies = self.get_job_list(offset=self.start_page * 20, limit=limit)

        # 2. 각 기업 상세 정보 수집
        for i, company in enumerate(companies):
            if len(all_companies) >= limit:
                break

            print(f"\n[{i+1}/{len(companies)}] 처리 중...")

            # 상세 정보
            company = self.get_company_detail(company)

            if not company.get('name'):
                print("  이름 없음, 스킵")
                continue

            print(f"  기업명: {company.get('name')}")

            # 웹사이트 추가 크롤링
            if company.get('website'):
                website_data = self.crawl_website(company['website'])
                if website_data.get('emails'):
                    company['emails'] = website_data['emails']
                if website_data.get('phones'):
                    company['phones'] = website_data['phones']

            all_companies.append(company)

        print(f"\n[원티드] 수집 완료: {len(all_companies)}개")
        return all_companies


# 테스트
if __name__ == '__main__':
    crawler = WantedCrawler()
    companies = crawler.collect(limit=3)

    for c in companies:
        print(f"\n{'='*50}")
        print(f"기업: {c.get('name')}")
        print(f"업종: {c.get('industry_text')}")
        print(f"웹사이트: {c.get('website')}")
        print(f"이메일: {c.get('emails', [])}")
        print(f"전화: {c.get('phones', [])}")
