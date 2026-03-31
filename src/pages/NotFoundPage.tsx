import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

export default function NotFoundPage() {
  return (
    <div className="error-boundary">
      <h1>404</h1>
      <p>페이지를 찾을 수 없습니다.</p>
      <div className="error-boundary__actions">
        <Link to={ROUTES.HOME} className="btn btn-primary">홈으로 돌아가기</Link>
      </div>
    </div>
  );
}
