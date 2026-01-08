import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Tabs from '@/components/ui/Tabs';
import SendQueue from '@/components/send/SendQueue';
import SendHistory from '@/components/send/SendHistory';
import AiDraftModal from '@/components/send/AiDraftModal';
import QueueEditModal from '@/components/send/QueueEditModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';

const tabs = [
  { id: 'queue', label: '발송 대기열' },
  { id: 'history', label: '발송 이력' },
];

export default function Send() {
  const router = useRouter();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('queue');
  const [queue, setQueue] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [history, setHistory] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [demoLinks, setDemoLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedIds, setSelectedIds] = useState([]);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [pendingSendIds, setPendingSendIds] = useState([]);
  const [sending, setSending] = useState(false);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/send/queue');
      const data = await res.json();
      if (data.success) {
        setQueue(data.data);
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
    }
  }, []);

  const fetchDrafts = useCallback(async () => {
    try {
      const res = await fetch('/api/drafts?status=draft');
      const data = await res.json();
      if (data.success) {
        setDrafts(data.data);
      }
    } catch (error) {
      console.error('Error fetching drafts:', error);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/send/history');
      const data = await res.json();
      if (data.success) {
        setHistory(data.data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchDemoLinks = async () => {
    try {
      const res = await fetch('/api/settings/demo-links');
      const data = await res.json();
      if (data.success) {
        setDemoLinks(data.data);
      }
    } catch (error) {
      // 기본 데모 링크 사용
      setDemoLinks([
        { name: '문서 자동화 데모', url: 'https://demo.gptko.co.kr/docs' },
        { name: '챗봇 데모', url: 'https://demo.gptko.co.kr/chatbot' },
        { name: '대시보드 데모', url: 'https://demo.gptko.co.kr/dashboard' },
      ]);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([
        fetchQueue(),
        fetchDrafts(),
        fetchHistory(),
        fetchTemplates(),
        fetchDemoLinks(),
      ]);
      setLoading(false);
    };
    fetchAll();
  }, [fetchQueue, fetchDrafts, fetchHistory]);

  useEffect(() => {
    // URL 파라미터 처리
    const { action, ids } = router.query;
    if (action === 'draft' && ids) {
      // 기업 정보 조회 후 모달 열기
      const companyIds = ids.split(',');
      fetchCompaniesForDraft(companyIds);
    }
  }, [router.query]);

  const fetchCompaniesForDraft = async (ids) => {
    try {
      const companies = [];
      for (const id of ids) {
        const res = await fetch(`/api/companies/${id}`);
        const data = await res.json();
        if (data.success) {
          companies.push(data.data);
        }
      }
      setSelectedCompanies(companies);
      setShowDraftModal(true);
      router.replace('/send', undefined, { shallow: true });
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const handleSelect = (id, checked) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((i) => i !== id)
    );
  };

  const handleSelectAll = (checked, items) => {
    setSelectedIds(checked ? items.map((i) => i.id) : []);
  };

  const handleGenerateDraft = async (companyIds, templateId, demoLink) => {
    const res = await fetch('/api/drafts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_ids: companyIds,
        template_id: templateId,
        demo_link: demoLink,
      }),
    });

    const result = await res.json();
    if (!result.success) throw new Error(result.message);

    fetchDrafts();
    return result;
  };

  const handleAddToQueue = async (draftIds) => {
    try {
      const res = await fetch('/api/send/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft_ids: draftIds }),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.message);

      toast.success(`${result.successCount}건 대기열 추가`);
      fetchQueue();
      fetchDrafts();
      setSelectedIds([]);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleSendClick = (queueIds) => {
    setPendingSendIds(queueIds);
    setShowSendConfirm(true);
  };

  const handleSendConfirm = async () => {
    setSending(true);
    try {
      const res = await fetch('/api/send/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue_ids: pendingSendIds }),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.message);

      if (result.failCount > 0) {
        toast.error(`발송 실패 ${result.failCount}건`);
      } else {
        toast.success(`발송 완료 ${result.successCount}건`);
      }
      fetchQueue();
      fetchHistory();
      setSelectedIds([]);
      setShowSendConfirm(false);
      setPendingSendIds([]);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSending(false);
    }
  };

  const handleRemoveFromQueue = async (ids) => {
    try {
      for (const id of ids) {
        await fetch(`/api/send/queue?id=${id}`, { method: 'DELETE' });
      }

      toast.success(`${ids.length}건 제거됨`);
      fetchQueue();
      fetchDrafts();
      setSelectedIds([]);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleRetry = (id) => {
    handleSendClick([id]);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (id, data) => {
    try {
      const res = await fetch('/api/send/queue', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.message);

      toast.success('수정 완료');
      fetchQueue();
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const getCurrentItems = () => {
    switch (activeTab) {
      case 'queue':
        return queue;
      case 'drafts':
        return drafts;
      case 'history':
        return history;
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">발송 관리</h1>
        <div className="flex gap-2">
          {activeTab === 'drafts' && selectedIds.length > 0 && (
            <Button onClick={() => handleAddToQueue(selectedIds)}>
              대기열에 추가
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs.map((t) => ({
          ...t,
          count: t.id === 'queue' ? queue.filter((q) => q.status === 'waiting').length : undefined,
        }))}
        activeTab={activeTab}
        onChange={(tab) => {
          setActiveTab(tab);
          setSelectedIds([]);
        }}
      />

      {/* Content */}
      {activeTab === 'queue' && (
        <SendQueue
          items={queue}
          loading={loading}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onSelectAll={(checked) => handleSelectAll(checked, queue)}
          onSend={handleSendClick}
          onRemove={handleRemoveFromQueue}
          onRetry={handleSendClick}
          onEdit={handleEdit}
        />
      )}

      {activeTab === 'history' && (
        <SendHistory items={history} loading={loading} />
      )}

      {/* Draft Modal */}
      <AiDraftModal
        isOpen={showDraftModal}
        onClose={() => {
          setShowDraftModal(false);
          setSelectedCompanies([]);
        }}
        onGenerate={handleGenerateDraft}
        selectedCompanies={selectedCompanies}
        templates={templates}
        demoLinks={demoLinks}
      />

      {/* Queue Edit Modal */}
      <QueueEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingItem(null);
        }}
        item={editingItem}
        onSave={handleSaveEdit}
      />

      {/* Send Confirm Modal */}
      <ConfirmModal
        isOpen={showSendConfirm}
        onClose={() => {
          setShowSendConfirm(false);
          setPendingSendIds([]);
        }}
        onConfirm={handleSendConfirm}
        title="이메일 발송 확인"
        message={`${pendingSendIds.length}건의 이메일을 발송하시겠습니까? 발송 후에는 취소할 수 없습니다.`}
        confirmText="발송"
        loading={sending}
      />
    </div>
  );
}
