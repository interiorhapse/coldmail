import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import CompanyList from '@/components/companies/CompanyList';
import CompanyForm from '@/components/companies/CompanyForm';
import CompanyDetail from '@/components/companies/CompanyDetail';
import CsvUpload from '@/components/companies/CsvUpload';
import { useToast } from '@/components/ui/Toast';

const priorityOptions = [
  { value: 'high', label: '높음' },
  { value: 'medium', label: '중간' },
  { value: 'low', label: '낮음' },
];

const sendStatusOptions = [
  { value: '미발송', label: '미발송' },
  { value: '1차완료', label: '1차완료' },
  { value: '2차완료', label: '2차완료' },
  { value: '3차완료', label: '3차완료' },
];

export default function Companies() {
  const router = useRouter();
  const toast = useToast();
  const [companies, setCompanies] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Filters
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sendStatusFilter, setSendStatusFilter] = useState('');

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showCsvUpload, setShowCsvUpload] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) params.append('search', search);
      if (industryFilter) params.append('industry', industryFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (sendStatusFilter) params.append('sendStatus', sendStatusFilter);

      const res = await fetch(`/api/companies?${params}`);
      const data = await res.json();

      if (data.success) {
        setCompanies(data.data);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, industryFilter, priorityFilter, sendStatusFilter]);

  const fetchIndustries = async () => {
    try {
      const res = await fetch('/api/companies/industries');
      const data = await res.json();
      if (data.success) {
        setIndustries(data.data);
      }
    } catch (error) {
      console.error('Error fetching industries:', error);
    }
  };

  useEffect(() => {
    fetchIndustries();
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    // URL action 파라미터 처리
    const { action } = router.query;
    if (action === 'add') {
      setShowForm(true);
      router.replace('/companies', undefined, { shallow: true });
    } else if (action === 'csv') {
      setShowCsvUpload(true);
      router.replace('/companies', undefined, { shallow: true });
    }
  }, [router.query]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCompanies();
  };

  const handleSelect = (id, checked) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((i) => i !== id)
    );
  };

  const handleSelectAll = (checked) => {
    setSelectedIds(checked ? companies.map((c) => c.id) : []);
  };

  const handleRowClick = (company) => {
    setSelectedCompany(company);
    setShowDetail(true);
  };

  const handleCreate = async (data) => {
    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!result.success) throw new Error(result.message);

    fetchCompanies();
  };

  const handleUpdate = async (data) => {
    const res = await fetch(`/api/companies/${selectedCompany.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!result.success) throw new Error(result.message);

    fetchCompanies();
    setShowDetail(false);
  };

  const handleDelete = async (id) => {
    const res = await fetch(`/api/companies/${id}`, {
      method: 'DELETE',
    });

    const result = await res.json();
    if (!result.success) throw new Error(result.message);

    fetchCompanies();
  };

  const handleAnalyze = async (ids) => {
    try {
      toast.info(`${ids.length}건 분석 중...`);
      const res = await fetch('/api/companies/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_ids: ids }),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.message);

      toast.success(`분석 완료 ${result.successCount}건`);
      fetchCompanies();
      setSelectedIds([]);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCsvUpload = async (data, industryId) => {
    try {
      const res = await fetch('/api/companies/csv-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, industry_id: industryId }),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.message);

      toast.success(`업로드 완료 ${result.successCount || result.success}건`);
      fetchCompanies();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleAddToQueue = async (ids) => {
    try {
      const res = await fetch('/api/send/queue-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_ids: ids }),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.message);

      if (result.failCount > 0) {
        toast.error(`실패 ${result.failCount}건`);
      } else {
        toast.success(`${result.successCount}건 대기열 추가`);
      }
      setSelectedIds([]);
      router.push('/send');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEdit = (company) => {
    setSelectedCompany(company);
    setShowDetail(false);
    setShowForm(true);
  };

  const industryOptions = industries.map((ind) => ({
    value: ind.id.toString(),
    label: ind.name,
  }));

  const totalPages = Math.ceil(total / limit);

  return (
    <div className={`space-y-6 ${selectedIds.length > 0 ? 'pb-24' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">기업 관리</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCsvUpload(true)}>
            CSV 업로드
          </Button>
          <Button onClick={() => { setSelectedCompany(null); setShowForm(true); }}>
            + 기업 추가
          </Button>
        </div>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Input
            placeholder="회사명, 담당자, 이메일 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            value={industryFilter}
            onChange={(e) => { setIndustryFilter(e.target.value); setPage(1); }}
            options={industryOptions}
            placeholder="업종 전체"
          />
          <Select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
            options={priorityOptions}
            placeholder="우선순위 전체"
          />
          <Select
            value={sendStatusFilter}
            onChange={(e) => { setSendStatusFilter(e.target.value); setPage(1); }}
            options={sendStatusOptions}
            placeholder="발송상태 전체"
          />
          <Button type="submit">검색</Button>
        </div>
      </form>

      {/* Stats */}
      <div className="text-sm text-gray-600">
        총 {total}개 기업
      </div>

      {/* Company List */}
      <CompanyList
        companies={companies}
        loading={loading}
        selectedIds={selectedIds}
        onSelect={handleSelect}
        onSelectAll={handleSelectAll}
        onRowClick={handleRowClick}
        onAnalyze={handleAnalyze}
        onAddToQueue={handleAddToQueue}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            이전
          </Button>
          <span className="px-4 py-2 text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            다음
          </Button>
        </div>
      )}

      {/* Modals */}
      <CompanyForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setSelectedCompany(null); }}
        onSubmit={selectedCompany ? handleUpdate : handleCreate}
        company={selectedCompany}
        industries={industries}
      />

      <CompanyDetail
        isOpen={showDetail}
        onClose={() => { setShowDetail(false); setSelectedCompany(null); }}
        company={selectedCompany}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAnalyze={handleAnalyze}
      />

      <CsvUpload
        isOpen={showCsvUpload}
        onClose={() => setShowCsvUpload(false)}
        onUpload={handleCsvUpload}
        industries={industries}
      />
    </div>
  );
}
