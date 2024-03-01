import { useLocalStorage } from "@mantine/hooks";
import axios from "axios";
import { useEffect } from "react";
import { env } from "../util/env";

const useAuthorization = () => {
  const [loggedIn, setLoggedIn] = useLocalStorage<boolean>({
    key: "loggedIn", defaultValue: false
  });
  const [user, ___, removeUser] = useLocalStorage<string>({
    key: "user", defaultValue: ""
  });
  const [perms, __, removePerms] = useLocalStorage<string[]>({
    key: "perms", defaultValue: []
  });
  const [header, _, removeHeader] = useLocalStorage<object>({
    key: "header", defaultValue: {}
  });
  
  useEffect(() => {
    if (!("Authorization" in header)) return;
    axios.get(
      `${env.API_URL}/api/validate-token`, 
      {headers: Object(header)}
    ).then(() => {

    }).catch((error) => {
      if (error?.response.status != 401) return; 
      removeHeader();
      removePerms();
      removeUser();
      setLoggedIn(false);
    })
  }, [header])



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