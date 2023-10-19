import { createContext, useEffect, useState } from "react";
import { decodeToken, isExpired } from "react-jwt";
import { useNavigate, useSearchParams } from "react-router-dom";

export const AuthContext = createContext({});

export const AuthProvider = ({ children }: any) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [token, setToken] = useState(() => {
    const tokenInUrl = searchParams.get("token");
    const tokenInStorage = localStorage.getItem("token");
    if (tokenInUrl && !isExpired(tokenInUrl)) return tokenInUrl;

    if (tokenInStorage && !isExpired(tokenInStorage)) return tokenInStorage;
    return null;
  });
  const [decodedToken, setDecodedToken] = useState<any>();

  useEffect(() => {
    const recoveredUser = localStorage.getItem("token");
    if (recoveredUser && !isExpired(recoveredUser)) setToken(recoveredUser);
    setInterval(() => {
      if (token && isExpired(token)) verifyToken();
    }, 1000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const verifyToken = async () => {
    if (token) {
      const myDecodedToken: any = decodeToken(token);
      if (
        myDecodedToken.hasOwnProperty("exp") &&
        !isExpired(token) &&
        myDecodedToken.hasOwnProperty("fingerprint") &&
        (await verifyAuthorization(myDecodedToken.fingerprint))
      ) {
        localStorage.setItem("token", token);
        setDecodedToken(myDecodedToken);
      } else {
        handleLogout();
      }
    }
  };

  async function verifyAuthorization(token: any) {
    const response = await fetch(
      "https://raw.githubusercontent.com/matheuswr89/trabalho-seguranca/master/Seguran%C3%A7a/autorizados.json"
    );
    const authorizeds = await response.json();

    return authorizeds.some((auth: any) => auth === token);
  }

  const handleLogout = () => {
    navigate("/");
    localStorage.removeItem("token");
    setDecodedToken(undefined);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{ authenticated: handleLogout, verifyToken, decodedToken, token }}
    >
      {children}
    </AuthContext.Provider>
  );
};
