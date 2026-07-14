// components/Card/Card.jsx
//
// Why it exists: The white rounded-box with shadow is used on every page.
//               Dashboard stats, forms, tables, detail views all use cards.
// Responsibility: Render a content container with optional header and footer.
// Used by: DashboardPage, UsersPage, ShopsPage, ProductsPage, every form modal.

const Card = ({ children, className = '' }) => (
  <div className={`card ${className}`}>{children}</div>
);

const CardHeader = ({ children, className = '' }) => (
  <div className={`card-header ${className}`}>{children}</div>
);

const CardBody = ({ children, className = '' }) => (
  <div className={`card-body ${className}`}>{children}</div>
);

const CardFooter = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-t border-surface-100 ${className}`}>{children}</div>
);

Card.Header = CardHeader;
Card.Body   = CardBody;
Card.Footer = CardFooter;

export default Card;
