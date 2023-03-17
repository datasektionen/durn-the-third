import axios from "axios";
import { useEffect, useState } from "react";
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

export const useAPIData = <R>(
  url: string, 
  parseData: (data: any) => Promise<R>,
  headers: any = {},
): [R | null, boolean, string | null] => {
  const [data, setData] = useState<R | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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
      parseData(data).then((data) => {
        setData(data);
        setError(null);
        setLoading(false);
      }).catch((error) => {
        setError("invalid data from API");
        setLoading(false);
      });
    }).catch((error) => {
      if (error.code != "ERR_CANCELED") {
        setError(error.response.data);
        setLoading(false);
      }
    });

    return () => controller.abort();
  }, [url, authHeader]);

  return [data, loading, error];
}