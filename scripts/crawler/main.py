# -*- coding: utf-8 -*-
"""
ColdMail 크롤러 메인 실행 파일
사용법: python main.py [--source saramin|rocketpunch|wanted|all] [--limit 100]
"""
import argparse
import logging
from datetime import datetime

from config import LOG_DIR, DAILY_LIMIT
from sources.saramin import SaraminCrawler
from parser.ai_parser import AIParser
from storage.supabase_client import SupabaseStorage

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(f'{LOG_DIR}/crawl_{datetime.now().strftime("%Y%m%d")}.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


def run_crawler(source='all', limit=DAILY_LIMIT, keywords=None):
    """
    크롤러 실행
    """
    logger.info(f"=== 크롤링 시작 (소스: {source}, 한도: {limit}) ===")

    storage = SupabaseStorage()
    ai_parser = AIParser()

    results = {
        'total': 0,
        'success': 0,
        'fail': 0,
        'companies': [],
    }

    # 수집 소스별 실행
    crawlers = []
    if source in ['saramin', 'all']:
        # 저장된 페이지 상태 로드
        state = storage.get_crawler_state('saramin')
        start_page = state.get('last_page', 0) + 1  # 마지막 페이지 다음부터
        if start_page > 100:  # 100페이지 넘으면 처음부터
            start_page = 1
        crawlers.append(('saramin', SaraminCrawler(start_page=start_page)))
    # if source in ['rocketpunch', 'all']:
    #     crawlers.append(('rocketpunch', RocketpunchCrawler()))
    # if source in ['wanted', 'all']:
    #     crawlers.append(('wanted', WantedCrawler()))

    for source_name, crawler in crawlers:
        logger.info(f"[{source_name}] 수집 시작...")

        try:
            companies = crawler.collect(keywords=keywords, limit=limit // len(crawlers))

            for company in companies:
                try:
                    results['total'] += 1

                    # 중복 체크
                    if storage.check_duplicate(company['name'], company.get('website')):
                        logger.info(f"  중복 스킵: {company['name']}")
                        continue

                    # AI 파싱으로 연락처 추출
                    all_text = ' '.join([
                        company.get('raw_text', ''),
                        company.get('website_raw_text', ''),
                        company.get('contact_page_text', ''),
                    ])

                    if all_text.strip():
                        logger.info(f"  AI 파싱: {company['name']}")
                        ai_result = ai_parser.extract_contacts(all_text, company['name'])
                        company['ai_contacts'] = ai_result.get('contacts', [])
                        company['company_email'] = ai_result.get('company_email')
                        company['company_phone'] = ai_result.get('company_phone')

                    # 연락처 결정 (우선순위: AI 추출 > 정규식 추출)
                    contact_email = None
                    contact_name = None
                    contact_title = None

                    # AI 추출 연락처 우선
                    if company.get('ai_contacts'):
                        for contact in company['ai_contacts']:
                            if contact.get('email'):
                                contact_email = contact['email']
                                contact_name = contact.get('name')
                                contact_title = contact.get('title')
                                break

                    # AI 실패 시 정규식 결과 사용
                    if not contact_email and company.get('emails'):
                        contact_email = company['emails'][0]

                    if not contact_email:
                        contact_email = company.get('company_email')

                    # 전화번호 결정
                    contact_phone = None
                    if company.get('phones'):
                        contact_phone = company['phones'][0]
                    elif company.get('company_phone'):
                        contact_phone = company['company_phone']

                    # DB 저장 데이터 구성
                    company_data = {
                        'name': company['name'],
                        'website': company.get('website'),
                        'contact_email': contact_email,  # None이면 null로 저장
                        'contact_name': contact_name or '담당자',
                        'contact_title': contact_title,
                        'contact_phone': contact_phone,
                        'source': source_name,
                        'priority': 'medium',
                        'send_status': '미발송',
                        'collected_at': datetime.now().isoformat(),  # 수집 시각
                    }

                    # 저장
                    save_result = storage.save_company(company_data)
                    logger.info(f"  저장 완료: {company['name']} ({save_result['action']})")

                    results['success'] += 1
                    results['companies'].append(company['name'])

                except Exception as e:
                    logger.error(f"  처리 오류 ({company.get('name', 'unknown')}): {e}")
                    results['fail'] += 1

            # 수집 로그 저장
            storage.log_collection(
                source=source_name,
                total=results['total'],
                success=results['success'],
                fail=results['fail']
            )

            # 크롤러 상태 저장 (마지막 페이지)
            if hasattr(crawler, 'last_page'):
                storage.save_crawler_state(source_name, {
                    'last_page': crawler.last_page,
                    'last_run': datetime.now().isoformat()
                })
                logger.info(f"[{source_name}] 페이지 상태 저장: {crawler.last_page}")

        except Exception as e:
            logger.error(f"[{source_name}] 크롤러 오류: {e}")

    logger.info(f"=== 크롤링 완료 (성공: {results['success']}, 실패: {results['fail']}) ===")
    return results


def main():
    parser = argparse.ArgumentParser(description='ColdMail 기업 정보 크롤러')
    parser.add_argument('--source', type=str, default='all',
                        choices=['saramin', 'rocketpunch', 'wanted', 'all'],
                        help='수집 소스 (기본: all)')
    parser.add_argument('--limit', type=int, default=DAILY_LIMIT,
                        help=f'수집 한도 (기본: {DAILY_LIMIT})')
    parser.add_argument('--keywords', type=str, nargs='+',
                        help='검색 키워드 (예: AI 스타트업 마케팅)')

    args = parser.parse_args()

    results = run_crawler(
        source=args.source,
        limit=args.limit,
        keywords=args.keywords
    )

    print(f"\n수집 결과:")
    print(f"  - 총 시도: {results['total']}")
    print(f"  - 성공: {results['success']}")
    print(f"  - 실패: {results['fail']}")


if __name__ == '__main__':
    main()
