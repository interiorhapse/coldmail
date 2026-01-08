const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function formatDate(date) {
  if (!date) return '-';

  const d = new Date(date);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const day = DAYS[d.getDay()];

  return `${yy}/${mm}/${dd}(${day})`;
}

export function formatDateTime(date) {
  if (!date) return '-';

  const d = new Date(date);
  const dateStr = formatDate(date);
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');

  return `${dateStr} ${hh}:${mi}`;
}

export function formatRelativeTime(date) {
  if (!date) return '-';

  const d = new Date(date);
  const now = new Date();
  const diff = now - d;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;

  return formatDate(date);
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export const priorityConfig = {
  high: { bg: 'bg-red-50', text: 'text-red-600', label: '높음' },
  medium: { bg: 'bg-yellow-50', text: 'text-yellow-600', label: '중간' },
  low: { bg: 'bg-green-50', text: 'text-green-600', label: '낮음' },
};

export const sendStatusConfig = {
  '미발송': { bg: 'bg-gray-100', text: 'text-gray-600' },
  '1차완료': { bg: 'bg-blue-50', text: 'text-blue-600' },
  '2차완료': { bg: 'bg-indigo-50', text: 'text-indigo-600' },
  '3차완료': { bg: 'bg-purple-50', text: 'text-purple-600' },
};

export function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }

  return { headers, data };
}

export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validateCompanyData(row) {
  const errors = [];

  if (!row.name && !row['회사명']) {
    errors.push('회사명 누락');
  }

  const email = row.contact_email || row['이메일'] || row['담당자이메일'];
  if (!email) {
    errors.push('이메일 누락');
  } else if (!validateEmail(email)) {
    errors.push('이메일 형식 오류');
  }

  return errors;
}
