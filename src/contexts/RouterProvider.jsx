import { useMemo, useState } from 'react';
import { RouterContext } from './RouterContext';

export function RouterProvider({ children }) {
  const [currentRoute, setCurrentRoute] = useState('/');
  const [routeParams, setRouteParams] = useState({});

  const navigate = (path, params = {}) => {
    setCurrentRoute(path);
    setRouteParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const value = useMemo(() => ({ currentRoute, routeParams, navigate }), [currentRoute, routeParams]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}
