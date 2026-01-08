import { formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export default function TemplateList({
  templates,
  loading,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        등록된 템플릿이 없습니다.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {templates.map((template) => (
        <div
          key={template.id}
          className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onSelect(template)}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{template.name}</h3>
              {template.is_default && (
                <Badge variant="primary">기본</Badge>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-2 line-clamp-1">
            {template.subject}
          </p>

          <p className="text-sm text-gray-500 mb-4 line-clamp-2">
            {template.body.substring(0, 100)}...
          </p>

          <div className="flex items-center justify-between pt-3 border-t">
            <span className="text-xs text-gray-400">
              사용: {template.use_count}회
            </span>
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDuplicate(template)}
              >
                복제
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(template)}
              >
                수정
              </Button>
              {!template.is_default && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-600"
                  onClick={() => onDelete(template)}
                >
                  삭제
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
