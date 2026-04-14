'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/Toast';
import Loading from '@/components/Loading';

// 사업자번호 형식 검사 (000-00-00000)
function validateBusinessNumber(value) {
  if (!value) return null; // 선택항목이므로 빈 값은 OK
  return /^\d{3}-\d{2}-\d{5}$/.test(value) ? null : '사업자번호 형식이 올바르지 않습니다. (예: 000-00-00000)';
}

// 전화번호 형식 검사
function validatePhone(value) {
  if (!value) return null;
  return /^[0-9\-+]{7,20}$/.test(value) ? null : '전화번호 형식이 올바르지 않습니다. (예: 010-1234-5678)';
}

// 이메일 형식 검사
function validateEmail(value) {
  if (!value) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : '이메일 형식이 올바르지 않습니다. (예: example@email.com)';
}

// 사업자번호 자동 하이픈 포맷
function formatBusinessNumber(value) {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

// 카카오 주소검색 팝업 실행
function openKakaoAddressSearch(onComplete) {
  if (!window.daum || !window.daum.Postcode) {
    alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
    return;
  }
  new window.daum.Postcode({
    oncomplete: function (data) {
      let fullAddress = data.address; // 기본 도로명 주소
      let extraAddress = '';
      if (data.addressType === 'R') {
        if (data.bname !== '') extraAddress += data.bname;
        if (data.buildingName !== '') {
          extraAddress += (extraAddress !== '' ? ', ' : '') + data.buildingName;
        }
        if (extraAddress !== '') fullAddress += ` (${extraAddress})`;
      }
      onComplete({ zonecode: data.zonecode, address: fullAddress });
    },
  }).open();
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const [kakaoLoaded, setKakaoLoaded] = useState(false);
  const addToast = useToast();

  const emptyForm = {
    business_number: '', company_name: '', representative: '',
    address: '', address_detail: '', business_type: '', business_category: '',
    phone: '', email: '', memo: '',
  };
  const [form, setForm] = useState(emptyForm);

  // 카카오 우편번호 API 스크립트 로드
  useEffect(() => {
    if (document.getElementById('kakao-postcode-script')) {
      setKakaoLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'kakao-postcode-script';
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    script.onload = () => setKakaoLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => { loadCustomers(); }, []);

  async function loadCustomers() {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error(err);
      addToast('거래처 목록을 불러오는 데 실패했습니다.', 'error');
    } finally { setLoading(false); }
  }

  function openNew() {
    setForm(emptyForm);
    setFormErrors({});
    setEditingCustomer(null);
    setShowModal(true);
  }

  function openEdit(customer) {
    setForm({
      business_number: customer.business_number || '',
      company_name: customer.company_name || '',
      representative: customer.representative || '',
      address: customer.address || '',
      address_detail: customer.address_detail || '',
      business_type: customer.business_type || '',
      business_category: customer.business_category || '',
      phone: customer.phone || '',
      email: customer.email || '',
      memo: customer.memo || '',
    });
    setFormErrors({});
    setEditingCustomer(customer);
    setShowModal(true);
  }

  // 단일 필드 유효성 검사
  function validateField(name, value) {
    switch (name) {
      case 'company_name':
        return !value.trim() ? '상호명은 필수 입력 항목입니다.' : null;
      case 'business_number':
        return validateBusinessNumber(value);
      case 'phone':
        return validatePhone(value);
      case 'email':
        return validateEmail(value);
      default:
        return null;
    }
  }

  // 입력 변경 핸들러 (실시간 에러 해제)
  function handleChange(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  }

  // 전체 폼 유효성 검사
  function validateAllFields() {
    const errors = {};
    const fieldsToCheck = ['company_name', 'business_number', 'phone', 'email'];
    fieldsToCheck.forEach((name) => {
      const err = validateField(name, form[name]);
      if (err) errors[name] = err;
    });
    return errors;
  }

  // 주소 검색 완료 핸들러
  const handleAddressComplete = useCallback((data) => {
    setForm((prev) => ({ ...prev, address: data.address, address_detail: '' }));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    const errors = validateAllFields();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // 첫 번째 에러 필드로 포커스
      const firstErrorField = Object.keys(errors)[0];
      document.getElementById(`field-${firstErrorField}`)?.focus();
      return;
    }

    // 저장 시 address + address_detail 합쳐서 전송
    const submitData = {
      ...form,
      address: form.address_detail
        ? `${form.address} ${form.address_detail}`.trim()
        : form.address,
    };
    delete submitData.address_detail;

    try {
      if (editingCustomer) {
        const res = await fetch(`/api/customers/${editingCustomer.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '수정 중 오류가 발생했습니다.');
        addToast('거래처가 수정되었습니다.');
      } else {
        const res = await fetch('/api/customers', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData),
        });
        const data = await res.json();
        if (!res.ok) {
          // 서버 에러를 한글로 변환
          const errorMsg = translateServerError(data.error);
          throw new Error(errorMsg);
        }
        addToast('거래처가 등록되었습니다.');
      }
      setShowModal(false);
      loadCustomers();
    } catch (err) {
      addToast(err.message, 'error');
    }
  }

  // 서버 에러 메시지 한글 변환
  function translateServerError(msg) {
    if (!msg) return '오류가 발생했습니다. 다시 시도해주세요.';
    if (msg.includes('duplicate key') || msg.includes('UNIQUE') || msg.includes('unique')) {
      return '이미 등록된 사업자번호입니다. 다른 사업자번호를 입력해주세요.';
    }
    if (msg.includes('network') || msg.includes('fetch')) {
      return '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
    }
    return '오류가 발생했습니다. 다시 시도해주세요.';
  }

  async function handleDelete(customer) {
    if (!confirm(`'${customer.company_name}' 거래처를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) return;
    try {
      const res = await fetch('/api/customers', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: customer.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '삭제 중 오류가 발생했습니다.');
      }
      addToast('거래처가 삭제되었습니다.');
      loadCustomers();
    } catch (err) {
      addToast(err.message, 'error');
    }
  }

  const filtered = customers.filter((c) =>
    c.company_name?.includes(search) ||
    c.business_number?.includes(search) ||
    c.representative?.includes(search)
  );

  return (
    <>
      <header className="main-header">
        <h1>거래처 관리</h1>
      </header>
      <div className="main-body">
        <div className="toolbar">
          <div className="toolbar-left">
            <input
              type="text" className="search-input"
              placeholder="상호명, 사업자번호, 대표자 검색..."
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="toolbar-right">
            <button className="btn btn-primary" onClick={openNew}>
              ➕ 거래처 등록
            </button>
          </div>
        </div>

        <div className="card">
          <div className="data-table-wrapper">
            {loading ? (
              <Loading />
            ) : filtered.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>상호명</th>
                    <th>사업자번호</th>
                    <th>대표자</th>
                    <th>전화번호</th>
                    <th>업태/종목</th>
                    <th style={{ textAlign: 'center' }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id}>
                      <td className="td-primary">{c.company_name}</td>
                      <td>{c.business_number || '-'}</td>
                      <td>{c.representative || '-'}</td>
                      <td>{c.phone || '-'}</td>
                      <td>{[c.business_type, c.business_category].filter(Boolean).join(' / ') || '-'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)} style={{ marginRight: 4 }}>수정</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c)}>삭제</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🏢</div>
                <div className="empty-state-title">거래처가 없습니다</div>
                <div className="empty-state-desc">새 거래처를 등록해보세요</div>
              </div>
            )}
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingCustomer ? '거래처 수정' : '거래처 등록'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSubmit} noValidate>
                <div className="modal-body">

                  {/* 상호명 + 사업자번호 */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="field-company_name">
                        상호명 <span className="form-required">*</span>
                      </label>
                      <input
                        id="field-company_name"
                        className={`form-input${formErrors.company_name ? ' form-input-error' : ''}`}
                        value={form.company_name}
                        onChange={(e) => handleChange('company_name', e.target.value)}
                        onBlur={(e) => handleChange('company_name', e.target.value)}
                        placeholder="상호명 입력"
                      />
                      {formErrors.company_name && (
                        <p className="form-error-msg">⚠ {formErrors.company_name}</p>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="field-business_number">사업자번호</label>
                      <input
                        id="field-business_number"
                        className={`form-input${formErrors.business_number ? ' form-input-error' : ''}`}
                        value={form.business_number}
                        onChange={(e) => handleChange('business_number', formatBusinessNumber(e.target.value))}
                        onBlur={(e) => handleChange('business_number', e.target.value)}
                        placeholder="000-00-00000"
                        maxLength={12}
                      />
                      {formErrors.business_number && (
                        <p className="form-error-msg">⚠ {formErrors.business_number}</p>
                      )}
                    </div>
                  </div>

                  {/* 대표자 + 전화번호 */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="field-representative">대표자</label>
                      <input
                        id="field-representative"
                        className="form-input"
                        value={form.representative}
                        onChange={(e) => handleChange('representative', e.target.value)}
                        placeholder="대표자명 입력"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="field-phone">전화번호</label>
                      <input
                        id="field-phone"
                        className={`form-input${formErrors.phone ? ' form-input-error' : ''}`}
                        value={form.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        onBlur={(e) => handleChange('phone', e.target.value)}
                        placeholder="010-0000-0000"
                      />
                      {formErrors.phone && (
                        <p className="form-error-msg">⚠ {formErrors.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* 주소 (검색 버튼 포함) */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="field-address">주소</label>
                    <div className="address-search-row">
                      <input
                        id="field-address"
                        className="form-input"
                        value={form.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        placeholder="주소검색 버튼을 누르거나 직접 입력"
                        readOnly={false}
                      />
                      <button
                        type="button"
                        className="btn btn-address-search"
                        onClick={() => openKakaoAddressSearch(handleAddressComplete)}
                        title="주소 검색"
                      >
                        🔍 주소검색
                      </button>
                    </div>
                    <input
                      className="form-input"
                      value={form.address_detail}
                      onChange={(e) => handleChange('address_detail', e.target.value)}
                      placeholder="상세주소 입력 (동, 호수 등)"
                      style={{ marginTop: 8 }}
                    />
                  </div>

                  {/* 업태 + 종목 */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="field-business_type">업태</label>
                      <input
                        id="field-business_type"
                        className="form-input"
                        value={form.business_type}
                        onChange={(e) => handleChange('business_type', e.target.value)}
                        placeholder="예: 제조업"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="field-business_category">종목</label>
                      <input
                        id="field-business_category"
                        className="form-input"
                        value={form.business_category}
                        onChange={(e) => handleChange('business_category', e.target.value)}
                        placeholder="예: 커튼, 블라인드"
                      />
                    </div>
                  </div>

                  {/* 이메일 */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="field-email">이메일</label>
                    <input
                      id="field-email"
                      className={`form-input${formErrors.email ? ' form-input-error' : ''}`}
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      onBlur={(e) => handleChange('email', e.target.value)}
                      placeholder="example@email.com"
                    />
                    {formErrors.email && (
                      <p className="form-error-msg">⚠ {formErrors.email}</p>
                    )}
                  </div>

                  {/* 메모 */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="field-memo">메모</label>
                    <textarea
                      id="field-memo"
                      className="form-textarea"
                      value={form.memo}
                      onChange={(e) => handleChange('memo', e.target.value)}
                      placeholder="추가 메모 사항을 입력해주세요."
                    />
                  </div>

                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
                  <button type="submit" className="btn btn-primary">{editingCustomer ? '수정' : '등록'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
