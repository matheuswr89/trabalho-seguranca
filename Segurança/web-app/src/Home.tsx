import { useContext, useEffect } from "react";
import Countdown from "react-countdown";
import { AuthContext } from "./context/AuthContext";

export default function Home() {
const {verifyToken, decodedToken, handleLogout}: any = useContext(AuthContext);
  const date = new Date(0);

  useEffect(() => {
    verifyToken();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="home-container">
      {decodedToken && (
        <div>
          <h1>Bem vindo, {decodedToken.name}!</h1>
          <p>Você faz parte da organização: {decodedToken.organization}.</p>
          <p>
            O token exprira em{" "}
            <Countdown date={new Date(date.setUTCSeconds(decodedToken.exp))} />
          </p>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
      {!decodedToken && (
        <>
          <h1>Você não está logado!</h1>
          <p>Insira o pendrive para poder acessar o site.</p>
        </>
      )}
    </div>
  );
}
