import { Component, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../constants/routes';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  resetKey: number;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, resetKey: 0 };
  }

  static getDerivedStateFromError(_error: Error): Partial<State> {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>문제가 발생했습니다</h2>
          <p>페이지를 불러오는 중 오류가 발생했습니다.</p>
          <div className="error-boundary__actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => this.setState((s) => ({ hasError: false, resetKey: s.resetKey + 1 }))}
            >
              다시 시도
            </button>
            <Link to={ROUTES.HOME} className="btn btn-secondary">
              홈으로
            </Link>
          </div>
        </div>
      );
    }
    return <div key={this.state.resetKey}>{this.props.children}</div>;
  }
}
