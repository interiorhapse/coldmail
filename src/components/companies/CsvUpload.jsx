import { useState, useRef } from 'react';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Table, { Thead, Tbody, Tr, Th, Td } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import { parseCSV, validateCompanyData } from '@/lib/utils';

export default function CsvUpload({
  isOpen,
  onClose,
  onUpload,
  industries = [],
}) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [industryId, setIndustryId] = useState('');
  const [preview, setPreview] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: 파일 선택, 2: 미리보기

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);

    try {
      const text = await selectedFile.text();
      const { headers, data } = parseCSV(text);

      // 데이터 검증
      const previewData = data.map((row, index) => {
        const rowErrors = validateCompanyData(row);
        return {
          ...row,
          _index: index + 2,
          _errors: rowErrors,
          _valid: rowErrors.length === 0,
        };
      });

      setPreview(previewData);
      setErrors(previewData.filter((r) => !r._valid));
      setStep(2);
    } catch (error) {
      alert('CSV 파일 파싱에 실패했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    const validData = preview.filter((r) => r._valid);

    if (validData.length === 0) {
      alert('업로드할 유효한 데이터가 없습니다.');
      return;
    }

    setLoading(true);
    try {
      await onUpload(validData, industryId);
      handleClose();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setErrors([]);
    setStep(1);
    setIndustryId('');
    onClose();
  };

  const industryOptions = industries.map((ind) => ({
    value: ind.id,
    label: ind.name,
  }));

  const validCount = preview.filter((r) => r._valid).length;
  const errorCount = preview.filter((r) => !r._valid).length;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="CSV 업로드" size="xl">
      {step === 1 ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              CSV 파일을 업로드하여 기업을 일괄 등록합니다.
            </p>
            <p className="text-xs text-gray-500">
              필수 컬럼: 회사명(name), 이메일(contact_email)
            </p>
            <p className="text-xs text-gray-500">
              선택 컬럼: 담당자(contact_name), 직책(contact_title), 전화번호(contact_phone), 웹사이트(website)
            </p>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              loading={loading}
            >
              CSV 파일 선택
            </Button>
            {file && (
              <p className="mt-2 text-sm text-gray-600">{file.name}</p>
            )}
          </div>

          <Select
            label="업종 (선택)"
            value={industryId}
            onChange={(e) => setIndustryId(e.target.value)}
            options={industryOptions}
            placeholder="업종 선택 (전체 적용)"
          />

          <ModalFooter>
            <Button variant="secondary" onClick={handleClose}>
              취소
            </Button>
          </ModalFooter>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex gap-4">
            <Badge variant="success">정상: {validCount}건</Badge>
            <Badge variant="danger">오류: {errorCount}건</Badge>
          </div>

          {/* Preview Table */}
          <div className="max-h-80 overflow-auto border rounded-lg">
            <Table>
              <Thead>
                <Tr>
                  <Th className="w-16">행</Th>
                  <Th>회사명</Th>
                  <Th>담당자</Th>
                  <Th>이메일</Th>
                  <Th>상태</Th>
                </Tr>
              </Thead>
              <Tbody>
                {preview.slice(0, 50).map((row, index) => (
                  <Tr key={index}>
                    <Td className="text-gray-500">{row._index}</Td>
                    <Td>{row.name || row['회사명'] || '-'}</Td>
                    <Td>{row.contact_name || row['담당자'] || '-'}</Td>
                    <Td>{row.contact_email || row['이메일'] || '-'}</Td>
                    <Td>
                      {row._valid ? (
                        <Badge variant="success">정상</Badge>
                      ) : (
                        <Badge variant="danger">{row._errors.join(', ')}</Badge>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>

          {preview.length > 50 && (
            <p className="text-sm text-gray-500">
              ... 외 {preview.length - 50}건 더 있음
            </p>
          )}

          <ModalFooter>
            <Button variant="secondary" onClick={() => setStep(1)}>
              이전
            </Button>
            <Button onClick={handleUpload} loading={loading} disabled={validCount === 0}>
              {validCount}건 업로드
            </Button>
          </ModalFooter>
        </div>
      )}
    </Modal>
  );
}
