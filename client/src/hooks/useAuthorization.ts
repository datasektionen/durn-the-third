import { useEffect } from "react";
import axios from "axios";
import { useLocalStorage } from "@mantine/hooks";


const useAuthorization = () => {
  const [loggedIn, setLoggedIn, removeLoggedIn] = useLocalStorage({
    key: "logged-in", defaultValue: false
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
  const [prevToken, setPrevToken] = useLocalStorage<string | null>({
    key: "prevToken", defaultValue: null
  })

  useEffect(() => {
    if (token == null) return
    if (prevToken == token) return
    const header = { "Authorization": `Bearer ${token}` }
    axios.get('/api/validate-token', {
      headers: header
    }).then(res => {
      setLoggedIn(true);
      setUser(res.data.user);
      setPerms(res.data.perms);
      setHeader(header)
      setPrevToken(token)
    }).catch(() => { // login token invalid, possibly because it has expired
      removeToken()
      removeHeader()
      removeUser()
      removePerms()
      removeLoggedIn()
    })
  }, [token])

  return {
    loggedIn,
    adminRead: perms.includes("admin-read"),
    adminWrite: perms.includes("admin-write"),
    user: user,
    perms: perms,
    authHeader: header
  };
};

export default useAuthorization;