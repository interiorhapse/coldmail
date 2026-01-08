import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import TemplateList from '@/components/templates/TemplateList';
import TemplateForm from '@/components/templates/TemplateForm';
import TemplatePreview from '@/components/templates/TemplatePreview';

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    fetchTemplates();
    fetchCompanies();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/companies?limit=50');
      const data = await res.json();
      if (data.success) {
        setCompanies(data.data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const handleCreate = async (data) => {
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!result.success) throw new Error(result.message);

    fetchTemplates();
  };

  const handleUpdate = async (data) => {
    const res = await fetch(`/api/templates/${selectedTemplate.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!result.success) throw new Error(result.message);

    fetchTemplates();
  };

  const handleDelete = async (template) => {
    if (!confirm(`"${template.name}" 템플릿을 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch(`/api/templates/${template.id}`, {
        method: 'DELETE',
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.message);

      fetchTemplates();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDuplicate = (template) => {
    setSelectedTemplate({
      name: `${template.name} (복사본)`,
      subject: template.subject,
      body: template.body,
      is_default: false,
    });
    setShowForm(true);
  };

  const handleSelect = (template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">템플릿 관리</h1>
        <Button onClick={() => { setSelectedTemplate(null); setShowForm(true); }}>
          + 템플릿 추가
        </Button>
      </div>

      {/* Template List */}
      <TemplateList
        templates={templates}
        loading={loading}
        onSelect={handleSelect}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
      />

      {/* Modals */}
      <TemplateForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setSelectedTemplate(null); }}
        onSubmit={selectedTemplate?.id ? handleUpdate : handleCreate}
        template={selectedTemplate}
      />

      <TemplatePreview
        isOpen={showPreview}
        onClose={() => { setShowPreview(false); setSelectedTemplate(null); }}
        template={selectedTemplate}
        companies={companies}
      />
    </div>
  );
}
