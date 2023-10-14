import React, { useEffect, useState } from "react"
import { useSearchParams } from 'react-router-dom';
import { isExpired, decodeToken } from "react-jwt";

export default function Home() {
    let [searchParams, setSearchParams] = useSearchParams();
    let [token, setToken] = useState(
        searchParams.get("token") || localStorage.getItem("token")
    );
    const [organization, setOrganization] = useState("");
    const [name, setName] = useState("");

    useEffect(() => {
        if (token) {
            const myDecodedToken: any = decodeToken(token);
            console.log(isExpired(token))
            setName(myDecodedToken.name)
            setOrganization(myDecodedToken.organization)
            localStorage.setItem("token", token)
        }
    }, [token]);

    const handleLogout = () => {
        localStorage.removeItem("token")
        setToken("")
    }

    return (
        <div className="home-container">
            {token &&
                <>

                    <h1>Bem vindo, {name}!</h1>
                    <p>Você faz parte da organização: {organization}.</p>
                    <button className="logout-button" onClick={handleLogout}>Logout</button>
                </>
            }
            {!token && <>
                <h1>Você não está logado!</h1>
                <p>Insira o pendrive para poder acessar o site.</p></>}
        </div>
    );
}