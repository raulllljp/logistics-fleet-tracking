import EmptyState from './EmptyState'
export default function PagePlaceholder({ title, description, label = 'Workspace' }) {
  return <div className="page-stack">
    <header><p className="eyebrow">{label}</p><h1 tabIndex={-1} id="page-heading">{title}</h1><p className="page-description">{description}</p></header>
    <EmptyState title="Your workspace is taking shape" message="This area is being prepared. Tools for this workspace will be available in a later release." />
  </div>
}
