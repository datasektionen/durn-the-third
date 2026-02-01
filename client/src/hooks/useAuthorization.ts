import { useLocalStorage } from "@mantine/hooks";
import axios from "axios";
import { useEffect } from "react";

const useAuthorization = () => {
  const [loggedIn, setLoggedIn] = useLocalStorage<boolean>({
    key: "loggedIn", defaultValue: false
  });
  const [user, setUser, removeUser] = useLocalStorage<string>({
    key: "user", defaultValue: ""
  });
  const [perms, setPerms, removePerms] = useLocalStorage<string[]>({
    key: "perms", defaultValue: []
  });
  const [header, _, removeHeader] = useLocalStorage<object>({
    key: "header", defaultValue: {}
  });

  useEffect(() => {

    axios.get('/api/check', {
    }).then(({ data }) => {

      setLoggedIn(true);
      setUser(data.user);
      setPerms(data.perms);
    }).catch(() => {
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
  };
};

export default useAuthorization;
