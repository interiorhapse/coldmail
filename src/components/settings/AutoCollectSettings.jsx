import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

export default function AutoCollectSettings({
  settings,
  industries,
  onSave,
}) {
  const [formData, setFormData] = useState({
    enabled: false,
    time: '04:00',
    industries: [],
    count_per_industry: 20,
    auto_ai_analysis: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (settings?.auto_collect) {
      setFormData(settings.auto_collect);
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleIndustryChange = (e) => {
    const value = parseInt(e.target.value);
    setFormData((prev) => {
      const current = prev.industries || [];
      const updated = current.includes(value)
        ? current.filter((id) => id !== value)
        : [...current, value];
      return { ...prev, industries: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({ auto_collect: formData });
      alert('설정이 저장되었습니다.');
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Enable/Disable */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="font-medium text-gray-900">자동 수집 활성화</p>
          <p className="text-sm text-gray-500">매일 지정 시간에 기업 정보를 자동 수집합니다.</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="enabled"
            checked={formData.enabled}
            onChange={handleChange}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
        </label>
      </div>

      {/* Time */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          수집 시간 (KST)
        </label>
        <input
          type="time"
          name="time"
          value={formData.time}
          onChange={handleChange}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2"
        />
        <p className="text-xs text-gray-500 mt-1">
          매일 지정된 시간에 자동으로 수집됩니다.
        </p>
      </div>

      {/* Industries */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          대상 업종
        </label>
        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-auto p-2 border rounded-lg">
          {industries.map((ind) => (
            <label
              key={ind.id}
              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={(formData.industries || []).includes(ind.id)}
                onChange={() =>
                  handleIndustryChange({ target: { value: ind.id } })
                }
                className="rounded border-gray-300 text-primary-600"
              />
              <span className="text-sm text-gray-700">{ind.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Count per industry */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          업종당 수집 건수
        </label>
        <input
          type="number"
          name="count_per_industry"
          value={formData.count_per_industry}
          onChange={handleChange}
          min={1}
          max={100}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      {/* Auto AI Analysis */}
      <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer">
        <input
          type="checkbox"
          name="auto_ai_analysis"
          checked={formData.auto_ai_analysis}
          onChange={handleChange}
          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <div>
          <p className="font-medium text-gray-900">수집 후 AI 분석 자동 실행</p>
          <p className="text-sm text-gray-500">수집된 기업에 대해 자동으로 AI 분석을 실행합니다.</p>
        </div>
      </label>

      <Button type="submit" loading={loading}>
        설정 저장
      </Button>
    </form>
  );
}
