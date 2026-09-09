import { Link } from 'react-router-dom'
export default function Brand({ to = '/', inverse = false }) {
  return <Link to={to} className={'brand ' + (inverse ? 'brand-inverse' : '')} aria-label="Fleetline home">
    <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 6h14M5 12h9M5 18h4M15 15l4 3-4 3" /></svg></span>
    <span>Fleetline<small>LOGISTICS & DELIVERY</small></span>
  </Link>
}
