import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./Home";
import Error from "./Error";
import { isExpired } from "react-jwt";
import { AuthProvider } from "./context/AuthContext";

const AppRoutes = () => {
  const Private = ({ children }: any) => {
    const token = localStorage.getItem("token");
    if (token) {
      if (!isExpired(token)) {
        console.log("passei");
        localStorage.removeItem("token");
      }
    }

    return children;
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            element={
              <Private>
                <Home />
              </Private>
            }
            path="/"
          />
          <Route element={<Error />} path="/error" />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;
