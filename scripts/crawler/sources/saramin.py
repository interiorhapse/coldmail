# -*- coding: utf-8 -*-
"""
사람인 크롤러
기업 정보 및 연락처 수집
"""
import time
import random
import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import CRAWL_DELAY, USER_AGENTS, MAX_RETRIES


class SaraminCrawler:
    def __init__(self, start_page=1):
        self.base_url = 'https://www.saramin.co.kr'
        self.review_url = 'https://www.saramin.co.kr/zf_user/company-review'
        self.start_page = start_page
        self.last_page = start_page
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': random.choice(USER_AGENTS),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Referer': 'https://www.saramin.co.kr/',
        })

    def _request(self, url, retries=0):
        """HTTP 요청 (재시도 로직 포함)"""
        try:
            delay = CRAWL_DELAY + random.uniform(1, 3)
            print(f"대기 {delay:.1f}초...")
            time.sleep(delay)

            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            return response
        except Exception as e:
            if retries < MAX_RETRIES:
                print(f"재시도 {retries + 1}/{MAX_RETRIES}: {url}")
                time.sleep(5)
                return self._request(url, retries + 1)
            print(f"요청 실패: {e}")
            return None

    def get_company_list(self, page=1, limit=50):
        """기업 리뷰 목록에서 기업 링크 수집 (여러 페이지에서)"""
        companies = []
        collected_csns = set()
        current_page = page
        max_pages = page + 5  # 최대 5페이지까지 순환

        while len(companies) < limit and current_page < max_pages:
            # 페이지별 URL
            url = f"{self.review_url}?page={current_page}"
            print(f"[사람인] 페이지 {current_page} 크롤링 중...")

            response = self._request(url)
            if not response:
                current_page += 1
                continue

            # CSN 코드가 포함된 링크 추출
            csn_pattern = re.findall(r'/zf_user/company-review/view\?csn=([^"&]+)', response.text)
            new_csns = [csn for csn in set(csn_pattern) if csn not in collected_csns]

            if not new_csns:
                print(f"[사람인] 페이지 {current_page}에서 새 기업 없음, 다음 페이지로...")
                current_page += 1
                continue

            print(f"[사람인] 페이지 {current_page}에서 {len(new_csns)}개 기업 발견")

            for csn in new_csns:
                if len(companies) >= limit:
                    break
                collected_csns.add(csn)
                companies.append({
                    'csn': csn,
                    'detail_url': f"{self.base_url}/zf_user/company-review/view?csn={csn}"
                })

            current_page += 1

        self.last_page = current_page  # 마지막 페이지 저장
        print(f"[사람인] 총 {len(companies)}개 기업 수집 (마지막 페이지: {current_page})")
        return companies

    def get_company_detail(self, company):
        """기업 상세 정보 수집"""
        url = company.get('detail_url')
        if not url:
            return company

        print(f"  상세 정보 수집: {url[:60]}...")

        response = self._request(url)
        if not response:
            return company

        soup = BeautifulSoup(response.text, 'html.parser')

        # 기업명 (h1이 가장 정확)
        name_elem = soup.select_one('h1')
        if name_elem:
            name = name_elem.get_text(strip=True)
            # 불필요한 텍스트 제거
            name = re.sub(r'기업정보.*$', '', name)
            name = re.sub(r'채용중\d*', '', name)
            name = re.sub(r'현직자\s*인터뷰\d*', '', name)
            name = re.sub(r'전체보기\d*', '', name)
            name = re.sub(r'\d+건.*$', '', name)
            company['name'] = name.strip()

        # 기업 정보 테이블/리스트에서 추출
        info_items = soup.select('.info_item, .company_info dt, .company_info dd, .info_list li')

        for item in info_items:
            text = item.get_text(strip=True)

            # 홈페이지
            if '홈페이지' in text or 'http' in text:
                link = item.select_one('a')
                if link:
                    company['website'] = link.get('href')

            # 업종
            if '업종' in text:
                company['industry_text'] = text.replace('업종', '').strip()

            # 주소
            if '주소' in text or '서울' in text or '경기' in text:
                company['address'] = text

        # 링크에서 홈페이지 찾기
        for link in soup.select('a[href^="http"]'):
            href = link.get('href', '')
            if href and 'saramin' not in href and 'naver' not in href and 'google' not in href:
                if not company.get('website'):
                    company['website'] = href
                break

        # 연락처 정보 (전체 텍스트에서)
        full_text = soup.get_text(separator=' ', strip=True)
        company['raw_text'] = full_text[:5000]  # AI 파싱용

        # 정규식으로 기본 추출
        emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', full_text)
        phones = re.findall(r'0\d{1,2}-\d{3,4}-\d{4}', full_text)

        # 사람인 관련 이메일/전화 필터링
        filtered_emails = [
            e for e in set(emails)
            if not any(x in e.lower() for x in ['saramin', 'help@', 'noreply', 'example'])
        ]
        filtered_phones = [
            p for p in set(phones)
            if p not in ['02-6226-5000', '02-6937-0039']  # 사람인 고객센터 번호 제외
        ]

        company['emails'] = filtered_emails[:3]
        company['phones'] = filtered_phones[:3]

        # 업종 추출
        industry_elem = soup.select_one('.industry, .company_industry, [class*="industry"]')
        if industry_elem:
            company['industry_text'] = industry_elem.get_text(strip=True)

        # 업종 텍스트에서 추출 시도
        industry_match = re.search(r'업종[:\s]*([가-힣\s/]+?)(?:\s|$|<)', full_text)
        if industry_match and not company.get('industry_text'):
            company['industry_text'] = industry_match.group(1).strip()

        return company

    def crawl_website(self, website_url):
        """기업 웹사이트에서 추가 연락처 수집"""
        if not website_url:
            return {}

        result = {'website_text': '', 'website_emails': [], 'website_phones': []}

        try:
            print(f"    웹사이트 크롤링: {website_url[:50]}...")
            response = self._request(website_url)
            if not response:
                return result

            soup = BeautifulSoup(response.text, 'html.parser')

            # 푸터 영역 우선
            footer = soup.select_one('footer, #footer, .footer')
            if footer:
                result['footer_text'] = footer.get_text(separator=' ', strip=True)

            # 전체 텍스트
            full_text = soup.get_text(separator=' ', strip=True)
            result['website_text'] = full_text[:3000]

            # 이메일/전화 추출
            emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', full_text)
            phones = re.findall(r'0\d{1,2}-\d{3,4}-\d{4}', full_text)

            result['website_emails'] = [e for e in set(emails) if not any(x in e.lower() for x in ['example', 'test', 'noreply'])][:5]
            result['website_phones'] = list(set(phones))[:5]

        except Exception as e:
            print(f"    웹사이트 오류: {e}")

        return result

    def collect(self, keywords=None, limit=50):
        """전체 수집 프로세스"""
        all_companies = []

        print(f"[사람인] 수집 시작 (시작 페이지: {self.start_page}, 한도: {limit})")

        # 1. 기업 목록 수집 (저장된 페이지부터 시작)
        companies = self.get_company_list(page=self.start_page, limit=limit)

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
                company.update(website_data)

            all_companies.append(company)

        print(f"\n[사람인] 수집 완료: {len(all_companies)}개")
        return all_companies


# 테스트
if __name__ == '__main__':
    crawler = SaraminCrawler()
    companies = crawler.collect(limit=3)

    for c in companies:
        print(f"\n{'='*50}")
        print(f"기업: {c.get('name')}")
        print(f"웹사이트: {c.get('website')}")
        print(f"이메일: {c.get('emails', [])}")
        print(f"전화: {c.get('phones', [])}")
