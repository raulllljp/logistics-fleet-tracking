import { Outlet } from 'react-router-dom'
import Brand from '../components/layout/Brand'
export default function PublicLayout() {
  return <div className="public-layout">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <aside className="public-story">
      <Brand inverse />
      <div className="story-copy"><p className="eyebrow">FROM PICKUP TO POSSIBILITY</p><h2>Keep every<br />delivery moving.</h2>
        <p>One workspace for the people, vehicles, and shipments that connect your business.</p>
        <svg className="route-motif" viewBox="0 0 340 110" fill="none" aria-hidden="true"><path d="M16 85h75c35 0 25-60 60-60h80c35 0 25 60 60 60h33" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 6" /><circle cx="16" cy="85" r="7" fill="currentColor" /><circle cx="170" cy="25" r="7" stroke="currentColor" strokeWidth="2" /><circle cx="324" cy="85" r="7" fill="currentColor" /></svg>
      </div>
      <p className="story-footer">Clarity at every stop.</p>
    </aside>
    <div className="public-content"><main id="main-content" tabIndex={-1}><Outlet /></main>
      <footer>Fleetline · Logistics & Fleet Delivery Tracking</footer>
    </div>
  </div>
}
