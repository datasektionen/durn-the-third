import { useLocalStorage } from "@mantine/hooks";

const useAuthorization = () => {
  const [loggedIn] = useLocalStorage({
    key: "loggedIn", defaultValue: false
  });
  const [user] = useLocalStorage<string>({
    key: "user", defaultValue: ""
  });
  const [perms] = useLocalStorage<string[]>({
    key: "perms", defaultValue: []
  });
  const [header] = useLocalStorage<object>({
    key: "header", defaultValue: {}
  })
  // const [token] = useLocalStorage<string | null>({
  //   key: "token", defaultValue: null
  // })

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