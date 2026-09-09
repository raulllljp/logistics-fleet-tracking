import { Link } from 'react-router-dom'
export default function NotFoundPage() {
  return <section className="standalone-page"><p className="eyebrow">404 / NOT FOUND</p><h1>This stop isn’t on the route.</h1><p>The page may have moved, or the address may be incorrect.</p><Link className="button button-primary" to="/">Go to your workspace</Link></section>
}
