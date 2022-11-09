import { useLocalStorage } from "@mantine/hooks";

const useAuthorization = () => {
  const [loggedIn, setLoggedIn, removeLoggedIn] = useLocalStorage({
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