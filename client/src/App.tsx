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

const App: React.FC = () => {
  const { loggedIn, admin } = useAuthorization();

  const adminLinks = [
    <Link to="/admin"> Admin </Link>,
  ];

  const color = "indigo";

  const config = {
    system_name: "durn",
    color_scheme: color,
    links: [
      <Link to="/">Hem</Link>,
      ...(admin ? adminLinks : [])
    ],
    login_href: loggedIn ? "#/logout" : "#/login",
    login_text: loggedIn ? "Logga ut" : "Logga in",
  }

  return (
    <HashRouter>
      <div id="application" className={color}>
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