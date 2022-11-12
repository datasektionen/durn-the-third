import { useLocalStorage } from "@mantine/hooks";
import axios from "axios";
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