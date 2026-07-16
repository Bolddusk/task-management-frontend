import { Link } from 'react-router-dom';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="page">
      <section className="page-hero">
        <span className="page-hero__eyebrow">COMING SOON</span>
        <h1 className="page-hero__title">{title}</h1>
        <p className="page-hero__description">{description}</p>
      </section>
      <div className="placeholder-card">
        <p>This section will be available in a future milestone.</p>
        <Link to="/" className="link-btn">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export function Unauthorized() {
  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Access Denied</h1>
        <p>You do not have permission to view this page.</p>
        <Link to="/" className="btn btn--primary btn--full">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
