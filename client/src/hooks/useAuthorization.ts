import { useEffect, useState } from "react";
import axios from "axios";

const useAuthorization = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState("");
  const [perms, setPerms] = useState<string[]>([]);

  useEffect(() => {
    setLoggedIn(false);
    
    const token = localStorage.getItem("token");
    if (token === null) {
      return;
    }
    
    axios.get(`#/api/validate-token`, {
      headers: { "Authorization": `Bearer ${token}`}
    }).then(res => {
      console.log(res);
      setLoggedIn(true);
      setUser(res.data.user);
      setPerms(res.data.perms)
    }).catch(() => { // login token invalid, possibly because it has expired
      localStorage.removeItem("token")
    })
  }, [localStorage]);


  return { loggedIn, admin: true, user: user, perms: perms};
};

export default useAuthorization;