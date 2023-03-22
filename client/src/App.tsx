import React, { useMemo } from "react";
import Methone from "methone";
import { HashRouter, Routes, Route, Link, } from "react-router-dom";
import useAuthorization from "./hooks/useAuthorization";

import { Home } from "./views/Home";
import { Login, Logout, Token } from "./components/Authentication";
import constants from "./util/constants";

import Admin from "./views/admin/Admin";
import EditElection from "./views/admin/EditElection";
import EditVoters from "./views/admin/EditVoters";
import AdminActions from "./views/admin/AdminActions"
import { CreateElection } from "./views/admin/CreateElection";

import "@total-typescript/ts-reset";
import Vote from "./views/Vote";
import Info from "./views/Info";

const App: React.FC = () => {
  const { loggedIn, adminRead } = useAuthorization();

  const config = useMemo(() => ({
    system_name: "durn",
    color_scheme: constants.themeColor,
    links: ([
      <Link key="1" to="/">Home</Link>,
      <Link key="2" to="/info">Info</Link>,
    ]).concat( loggedIn && adminRead ? [
      <Link key="3" to="/admin">Admin Elections</Link>,
      <Link key="4" to="/admin/voters">Admin Voters</Link>,
    ] : [] ),
    login_href: loggedIn ? "#/logout" : "#/login",
    login_text: loggedIn ? "Logga ut" : "Logga in",
  }), [adminRead, loggedIn])

  return (
    <HashRouter>
      <div id="application" className={constants.themeColor}>
        <Methone config = {config} />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/logout" element={<Logout />} /> 
          <Route path="/token/:token" element={<Token />} />

          <Route path="/info" element={<Info />} />


          <Route path="/vote/:id" element={<Vote />} />

          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/create" element={<CreateElection />} />
          <Route path="/admin/election/:id" element={<EditElection />} />
          <Route path="/admin/voters" element={<EditVoters />} />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;