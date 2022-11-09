import React from "react";
import Methone from "methone";
import {
  HashRouter,
  Routes,
  Route,
  Link,
} from "react-router-dom";
import useAuthorization from "./hooks/useAuthorization";

import { Home } from "./views/Home";
import { Login, Logout, Token } from "./components/Authentication";
import constants from "./util/constants";

import Admin from "./views/admin/Admin";
import EditElection from "./views/admin/EditElection";
import EditVoters from "./views/admin/EditVoters";

const App: React.FC = () => {
  const { loggedIn, adminRead, adminWrite } = useAuthorization();

  const config = {
    system_name: "durn",
    color_scheme: constants.themeColor,
    links: [
      ...(adminRead ? [
        <Link to="/">Hem</Link>,
        <Link to="/admin">Administrera val</Link>,
        <Link to="/admin/voters">Administrera väljare </Link>
      ] : [])
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

          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/election/:id" element={<EditElection />} />
          <Route path="/admin/voters" element={<EditVoters />} />


        </Routes>

      </div>
    </HashRouter>
  );
};

export default App;