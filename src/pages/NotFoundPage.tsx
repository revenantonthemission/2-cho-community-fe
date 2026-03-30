import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

export default function NotFoundPage() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
      <h1>404</h1>
      <p>페이지를 찾을 수 없습니다.</p>
      <Link to={ROUTES.HOME}>홈으로 돌아가기</Link>
    </div>
  );
}
