import { useEffect, useState } from "react";
import axios from "axios";

const useAuthorization = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState("");
  const [perms, setPerms] = useState<string[]>([]);
  const [header, setHeader] = useState<object>({})
  const [token, setToken] = useState("")

  useEffect(() => {
    const tempToken = localStorage.getItem("token");
    if (tempToken === null) {
      setToken("")
      return;
    }
    if (tempToken != token) {
      setToken(tempToken)
    }
  }, [localStorage])

  useEffect(() => {
    if (token == "") return;
    const header = { "Authorization": `Bearer ${token}` }
    axios.get('/api/validate-token', {
      headers: header
    }).then(res => {
      console.log(res);
      setLoggedIn(true);
      setUser(res.data.user);
      setPerms(res.data.perms);
      setHeader(header)
    }).catch(() => { // login token invalid, possibly because it has expired
      localStorage.removeItem("token")
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