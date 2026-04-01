import { useState } from 'react';
import { PACKAGE_CATEGORIES, type PackageCategory } from '../../types/package';

interface PackageFormData {
  name?: string;
  display_name: string;
  description: string;
  homepage_url: string;
  category: PackageCategory | '';
  package_manager: string;
}

interface Props {
  initialData?: {
    name?: string;
    display_name: string;
    description: string;
    homepage_url: string;
    category: PackageCategory;
    package_manager: string;
  };
  showName?: boolean;
  onSubmit: (data: PackageFormData) => Promise<void>;
  submitLabel: string;
}

const PACKAGE_MANAGERS = ['apt', 'pacman', 'dnf', 'brew', 'snap', 'flatpak', 'nix'];

export default function PackageForm({ initialData, showName = false, onSubmit, submitLabel }: Props) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [displayName, setDisplayName] = useState(initialData?.display_name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [homepageUrl, setHomepageUrl] = useState(initialData?.homepage_url ?? '');
  const [category, setCategory] = useState<PackageCategory | ''>(initialData?.category ?? '');
  const [packageManager, setPackageManager] = useState(initialData?.package_manager ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim() || !category) return;
    setIsSubmitting(true);
    try {
      const data: PackageFormData = {
        display_name: displayName.trim(),
        description: description.trim(),
        homepage_url: homepageUrl.trim(),
        category,
        package_manager: packageManager,
      };
      if (showName) data.name = name.trim();
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="pkg-form">
      {showName && (
        <div className="input-group">
          <label htmlFor="pkg-name">패키지 이름</label>
          <input id="pkg-name" className="input-field" type="text" value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="vim" maxLength={100} required aria-required="true" />
          <p className="input-hint">고유 식별자 (영문, 숫자, 하이픈)</p>
        </div>
      )}
      <div className="input-group">
        <label htmlFor="pkg-display-name">표시 이름</label>
        <input id="pkg-display-name" className="input-field" type="text" value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Vim Text Editor" maxLength={200} required aria-required="true" />
      </div>
      <div className="input-group">
        <label htmlFor="pkg-desc">설명</label>
        <textarea id="pkg-desc" className="input-field" value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="패키지에 대한 설명" maxLength={2000} rows={4} />
      </div>
      <div className="input-group">
        <label htmlFor="pkg-url">홈페이지 URL</label>
        <input id="pkg-url" className="input-field" type="url" value={homepageUrl}
          onChange={(e) => setHomepageUrl(e.target.value)}
          placeholder="https://www.vim.org" maxLength={500} />
      </div>
      <div className="input-group">
        <label htmlFor="pkg-category">카테고리</label>
        <select id="pkg-category" className="input-field" value={category}
          onChange={(e) => setCategory(e.target.value as PackageCategory)} required aria-required="true">
          <option value="">선택하세요</option>
          {PACKAGE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>
      <div className="input-group">
        <label htmlFor="pkg-manager">패키지 매니저</label>
        <select id="pkg-manager" className="input-field" value={packageManager}
          onChange={(e) => setPackageManager(e.target.value)}>
          <option value="">선택 안 함</option>
          {PACKAGE_MANAGERS.map((pm) => (
            <option key={pm} value={pm}>{pm}</option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn btn-primary"
        disabled={isSubmitting || !displayName.trim() || !category}>
        {isSubmitting ? '처리 중...' : submitLabel}
      </button>
    </form>
  );
}
