import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';
import AutoCollectSettings from '@/components/settings/AutoCollectSettings';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { formatDateTime } from '@/lib/utils';

const tabs = [
  { id: 'collect', label: '자동 수집' },
  { id: 'send', label: '발송 설정' },
  { id: 'info', label: '시스템 정보' },
];

export default function Settings() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('collect');
  const [settings, setSettings] = useState({});
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);
  const [showCollectConfirm, setShowCollectConfirm] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchIndustries();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSave = async (data) => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!result.success) throw new Error(result.message);

    fetchSettings();
  };

  const handleSendSettingsChange = async (e) => {
    const { name, value } = e.target;
    const newSettings = {
      ...settings.send_settings,
      [name]: parseInt(value) || value,
    };
    await handleSave({ send_settings: newSettings });
  };

  const handleCollect = async () => {
    setCollecting(true);
    setShowCollectConfirm(false);
    toast.info('수집을 시작합니다. 잠시 기다려주세요...');

    try {
      const res = await fetch('/api/cron/auto-collect?force=true');
      const data = await res.json();

      if (data.success) {
        if (data.skipped) {
          toast.info(data.message);
        } else {
          toast.success(data.message);
        }
        fetchSettings();
      } else {
        toast.error(data.message || '수집 중 오류가 발생했습니다.');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCollecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">설정</h1>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="bg-white rounded-xl shadow-sm p-6">
        {activeTab === 'collect' && (
          <AutoCollectSettings
            settings={settings}
            industries={industries}
            onSave={handleSave}
          />
        )}

        {activeTab === 'send' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">발송 설정</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                발송 간격 (분)
              </label>
              <input
                type="number"
                name="interval_minutes"
                value={settings.send_settings?.interval_minutes || 2}
                onChange={handleSendSettingsChange}
                min={1}
                max={60}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                대기열의 이메일을 발송하는 간격입니다.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                일일 발송 한도
              </label>
              <input
                type="number"
                name="daily_limit"
                value={settings.send_settings?.daily_limit || 100}
                onChange={handleSendSettingsChange}
                min={1}
                max={500}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                하루에 발송할 수 있는 최대 이메일 수입니다.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">시스템 정보</h3>

            <div className="grid grid-cols-2 gap-4">
              <InfoItem
                label="마지막 자동 수집"
                value={
                  settings.last_auto_collect?.executed_at
                    ? formatDateTime(settings.last_auto_collect.executed_at)
                    : '없음'
                }
              />
              <InfoItem
                label="수집 결과"
                value={
                  settings.last_auto_collect?.result
                    ? `성공 ${settings.last_auto_collect.result.success}건`
                    : '-'
                }
              />
              <InfoItem label="발신 이메일" value={process.env.NEXT_PUBLIC_SENDER_EMAIL || 'jeweleg@gptko.co.kr'} />
              <InfoItem label="발신자명" value={process.env.NEXT_PUBLIC_SENDER_NAME || 'GPTko AI사업팀'} />
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium text-gray-900 mb-3">수동 실행</h4>
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowCollectConfirm(true)}
                  disabled={collecting}
                  className="bg-primary-600 hover:bg-primary-700"
                >
                  {collecting ? (
                    <>
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                      수집 중...
                    </>
                  ) : (
                    '지금 수집 시작'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      toast.info('대기열 처리를 시작합니다...');
                      const res = await fetch('/api/cron/process-queue');
                      const data = await res.json();
                      if (data.success) {
                        toast.success(data.message);
                      } else {
                        toast.error(data.message);
                      }
                    } catch (error) {
                      toast.error(error.message);
                    }
                  }}
                >
                  대기열 처리 실행
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Collect Confirm Modal */}
      <ConfirmModal
        isOpen={showCollectConfirm}
        onClose={() => setShowCollectConfirm(false)}
        onConfirm={handleCollect}
        title="기업 정보 수집"
        message="설정된 소스에서 기업 정보를 수집합니다. 수집에는 몇 분이 소요될 수 있습니다. 진행하시겠습니까?"
        confirmText="수집 시작"
        loading={collecting}
      />
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}
