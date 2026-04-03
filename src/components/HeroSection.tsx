import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface HeroSectionProps {
  title: string;
  subtitle: string;
  actionText?: string;
  actionLink?: string;
}

export default function HeroSection({ title, subtitle, actionText, actionLink }: HeroSectionProps) {
  const { isAuthenticated } = useAuth();
  return (
    <section className="hero-section">
      <h1 className="hero-section__title">{title}</h1>
      <p className="hero-section__subtitle">{subtitle}</p>
      {actionText && actionLink && isAuthenticated && (
        <Link to={actionLink} className="btn btn-primary">{actionText}</Link>
      )}
    </section>
  );
}
