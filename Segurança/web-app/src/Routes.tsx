import React from "react";
import { BrowserRouter as Router, Routes as Switch, Route } from 'react-router-dom';
import Home from "./Home";
import Error from "./Error";

const Routes = () => {
    return (
        <Router>
            <Switch>
                <Route element={<Home />} path="/" />
                <Route element={<Error />} path="/error" />
            </Switch>
        </Router>
    )
}

export default Routes;
