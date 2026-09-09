import { Outlet } from 'react-router-dom'
import Brand from '../components/layout/Brand'
export default function PublicLayout() {
  return <div className="public-layout">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <aside className="public-story">
      <Brand inverse />
      <div className="story-copy"><p className="eyebrow">FROM PICKUP TO POSSIBILITY</p><h2>Keep every<br />delivery moving.</h2>
        <p>One workspace for the people, vehicles, and shipments that connect your business.</p>
        <div className="journey" aria-hidden="true"><span /><i /><span /><i /><span /></div>
      </div>
      <p className="story-footer">Clarity at every stop.</p>
    </aside>
    <div className="public-content"><main id="main-content" tabIndex={-1}><Outlet /></main>
      <footer>Fleetline · Logistics & Fleet Delivery Tracking</footer>
    </div>
  </div>
}
