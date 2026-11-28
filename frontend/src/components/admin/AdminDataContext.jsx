import { createContext, useContext } from 'react';
import useAdminResource from '../../hooks/useAdminResource';
import { adminModeration } from '../../services/adminModeration';
function useData() {
  const stats = useAdminResource(adminModeration.stats);
  const reports = useAdminResource(adminModeration.reportCounts);
  return {
    stats,
    reports,
    reload: () => {
      stats.reload();
      reports.reload();
    }
  };
}
const Context = createContext(null);
export function AdminDataProvider({
  children
}) {
  const data = useData();
  return <Context.Provider value={data}>{children}</Context.Provider>;
}
export function useAdminData() {
  const value = useContext(Context);
  if (!value) throw new Error('Admin data provider missing');
  return value;
}
