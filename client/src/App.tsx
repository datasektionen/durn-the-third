import React from "react";
import Methone, { Header } from "methone";
import {
  BrowserRouter,
  HashRouter,
  Routes,
  Route,
  Link,
} from "react-router-dom";
import useAuthorization from "./hooks/useAuthorization";

import { Home } from "./views/Home";
import { Admin } from "./views/admin/Admin";
import { Login, Logout, Token } from "./components/Authentication";
import constants from "./util/constants";

const App: React.FC = () => {
  const { loggedIn, adminRead, adminWrite } = useAuthorization();

  const adminLinks = [
    <Link to="/admin"> Admin </Link>,
  ];

  const config = {
    system_name: "durn",
    color_scheme: constants.themeColor,
    links: [
      <Link to="/">Hem</Link>,
      ...(adminRead ? adminLinks : [])
    ],
    login_href: loggedIn ? "#/logout" : "#/login",
    login_text: loggedIn ? "Logga ut" : "Logga in",
  }

  return (
    <HashRouter>
      <div id="application" className={constants.themeColor}>
        <Methone config = {config} />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/logout" element={<Logout />} /> 
          <Route path="/token/:token" element={<Token />} />

          <Route path="/admin" element={<Admin />}>
            
          </Route>

        </Routes>

      </div>
    </HashRouter>
  );
};

export default App;