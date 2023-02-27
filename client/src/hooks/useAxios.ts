import { useLocalStorage } from "@mantine/hooks";
import axios from "axios";
import { useEffect, useState } from "react";
import constants from "../util/constants";

import useAuthorization from "./useAuthorization";

export interface ErrorData {
  code: number,
  response: string
}

export const useApiRequester = () => {
  const { authHeader } = useAuthorization()
  return (
    method: "get" | "put" | "post" | "delete" | "patch",
    url: string,
    data: any,
    onSuccess: (data: any) => void = () => {},
    onError: (error: ErrorData) => void = () => {},
    headers: any = {}
  ) => {
    axios({
      method: method,
      url: url,
      data: data,
      headers: {
        ...authHeader,
        ...headers,
      }
    }).then(({data}) => {
      onSuccess(data)
    }).catch(({response}) => {
      const { status, data } = response
      onError({
        code: status,
        response: data
      })
    })
  }
}

export const useAPIData = (url: string, headers: any = {}) => {
  const [data, setData] = useState<any>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string|null>(null);
  const { authHeader } = useAuthorization();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    axios(url, {
      signal: controller.signal,
      headers: {
        ...authHeader,
        ...headers,
      }
    }).then(({data}) => {
      setData(data);
      setError(null);
      setLoading(false);
    }).catch((error) => {
      setError(error);
      setLoading(false);
    });

    return () => controller.abort();
  }, [url, authHeader]);

  return [data, loading, error];
}