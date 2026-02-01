import { useLocalStorage } from "@mantine/hooks";
import axios from "axios";
import React, { useEffect } from "react";
import {
  useParams,
  useNavigate,
} from "react-router-dom";

export const Login: React.FC = () => {
  window.location.replace("/api/login");
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

  if (loggedIn) {
    setLoggedIn(false)
    removeHeader()
    removeUser()
    removePerms()
  }
  window.location.replace("/api/logout");
  return <div />;
}
