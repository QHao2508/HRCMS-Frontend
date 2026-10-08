import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { RealtimeProvider } from "./context/RealtimeProvider.jsx";
import AppRoutes from "./routes/AppRoutes";

/**
 * Gắn BrowserRouter, AuthProvider và AppRoutes để toàn bộ màn hình dùng chung điều hướng và phiên đăng nhập.
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RealtimeProvider><AppRoutes /></RealtimeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;