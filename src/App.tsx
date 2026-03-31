import { useState, useEffect, useCallback } from 'react';
import { DocuSignShell } from '@/design-system';
import { buildNavItems } from '@/config/globalNav';
import { sidebars } from '@/config/sidebars';
import { resolveRoute } from '@/config/pages';
import type { TabId } from '@/config/globalNav';
import type { RouteConfig } from '@/config/pages';

import DashboardPage from '@/pages/DashboardPage';
import TablePage from '@/pages/TablePage';
import InsightsPage from '@/pages/InsightsPage';
import PlaceholderPage from '@/pages/PlaceholderPage';

/* ═══════════════════════════════════════
   Hash Router
   Reads window.location.hash, resolves it
   to a RouteConfig, and renders the right page.
   ═══════════════════════════════════════ */

function useHashRoute() {
  const [route, setRoute] = useState<RouteConfig>(() =>
    resolveRoute(window.location.hash)
  );

  useEffect(() => {
    const onHashChange = () => {
      setRoute(resolveRoute(window.location.hash));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((hash: string) => {
    window.location.hash = hash;
  }, []);

  return { route, navigate };
}

/* ═══════════════════════════════════════
   Page Renderer
   Maps route.page to the correct component.
   ═══════════════════════════════════════ */

function renderPage(route: RouteConfig) {
  switch (route.page) {
    case 'dashboard':
      return <DashboardPage />;
    case 'table':
      return <TablePage />;
    case 'insights':
      return <InsightsPage />;
    case 'placeholder':
      return <PlaceholderPage title={route.placeholderTitle ?? 'Page'} />;
    default:
      return <PlaceholderPage title="Page Not Found" />;
  }
}

/* ═══════════════════════════════════════
   Build LocalNav config from sidebar config
   Wires up onClick handlers and active state.
   ═══════════════════════════════════════ */

function buildLocalNav(
  tabId: TabId,
  activeItemId: string,
  navigate: (hash: string) => void,
) {
  const sidebar = sidebars[tabId];

  return {
    headerLabel: sidebar.headerLabel,
    headerIcon: sidebar.headerIcon as any,
    headerMenuItems: sidebar.headerMenuItems?.map((item) => ({
      ...item,
      icon: item.icon as any,
    })),
    sections: sidebar.sections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        icon: item.icon as any,
        active: item.id === activeItemId,
        onClick: () => navigate(item.hash),
      })),
    })),
  };
}

/* ═══════════════════════════════════════
   App — Config-driven multi-page shell
   DocuSignShell + hash routing + page transitions
   ═══════════════════════════════════════ */

export default function App() {
  const { route, navigate } = useHashRoute();

  // Fade transition state
  const [visible, setVisible] = useState(true);
  const [displayedRoute, setDisplayedRoute] = useState(route);

  useEffect(() => {
    if (route === displayedRoute) return;

    // Fade out, swap page, fade in
    setVisible(false);
    const timer = setTimeout(() => {
      setDisplayedRoute(route);
      setVisible(true);
    }, 150);

    return () => clearTimeout(timer);
  }, [route, displayedRoute]);

  const globalNavConfig = {
    logo: <img src="/docusign-logo.svg" alt="DocuSign" />,
    navItems: buildNavItems(displayedRoute.tab, navigate),
    showSearch: true,
    showNotifications: true,
    notificationCount: 3,
    showSettings: true,
    user: { name: 'Jane Smith' },
  };

  const localNavConfig = buildLocalNav(
    displayedRoute.tab,
    displayedRoute.sidebarItemId,
    navigate,
  );

  return (
    <DocuSignShell
      globalNav={globalNavConfig}
      localNav={localNavConfig}
    >
      <div
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 150ms ease-in-out',
        }}
      >
        {renderPage(displayedRoute)}
      </div>
    </DocuSignShell>
  );
}
