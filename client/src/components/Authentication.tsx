import { useLocalStorage } from "@mantine/hooks";
import axios from "axios";
import React, { useEffect } from "react";
import {
  useParams,
  useNavigate,
} from "react-router-dom";

export const Login: React.FC = () => {
  const callback = encodeURIComponent(`${window.location.origin}/#/token/`)
  const url = `${process.env.LOGIN_URL}/login?callback=${callback}`;
  window.location.replace(url);
  return <div />;
}

export const Logout: React.FC = () => {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useLocalStorage({
    key: "loggedIn", defaultValue: false
  });
  const [user, setUser, removeUser] = useLocalStorage<string>({
    key: "user", defaultValue: ""
  });
  const [perms, setPerms, removePerms] = useLocalStorage<string[]>({
    key: "perms", defaultValue: []
  });
  const [header, setHeader, removeHeader] = useLocalStorage<object>({
    key: "header", defaultValue: {}
  })
  const [token, setToken, removeToken] = useLocalStorage<string | null>({
    key: "token", defaultValue: null
  })

  setLoggedIn(false)
  removeToken()
  removeHeader()
  removeUser()
  removePerms()
  navigate("/", { replace: true });
  return <div />;
}

export const Token: React.FC = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loggedIn, setLoggedIn] = useLocalStorage<boolean>({
    key: "loggedIn", defaultValue: false
  });
  const [user, setUser] = useLocalStorage<string>({
    key: "user", defaultValue: ""
  });
  const [perms, setPerms] = useLocalStorage<string[]>({
    key: "perms", defaultValue: []
  });
  const [authHeader, setHeader] = useLocalStorage<object>({
    key: "header", defaultValue: {}
  })
  const [storedToken, setToken] = useLocalStorage<string | null>({
    key: "token", defaultValue: null
  })

  if (token) {
    const header = { "Authorization": `Bearer ${token}` }
    console.log(header)
    axios.get('/api/validate-token', {
      headers: header
    }).then(({ data }) => {
      setLoggedIn(true)
      setUser(data.user)
      setPerms(data.perms)
      setHeader(header)
      setToken(token)
    }).catch() // login token likely invalid
  }

  navigate("/", { replace: true });
  return <div />;
}