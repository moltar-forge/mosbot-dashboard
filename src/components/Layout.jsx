import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="flex h-screen overflow-hidden bg-dark-950">
      {/* Sidebar - hidden on login page */}
      {!isLoginPage && <Sidebar />}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
