import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
  const navigate = useNavigate();
  return (
    <button type="button" className="btn btn-secondary btn-sm back-btn" onClick={() => navigate(-1)} aria-label="뒤로가기">
      <ArrowLeft size={16} />
    </button>
  );
}
