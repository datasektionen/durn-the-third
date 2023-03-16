import { Center } from "@mantine/core"
import React from "react"


export const Loading: React.FC = () => {

  return <>
    Loading
  </>
}


export interface ErrorProps {
  error: string
}
export const Error: React.FC<ErrorProps> = ({ error }) => {

  return <>
    Error <br/>
    {error}
  </>
}


export interface LoadingContainerProps {
  error: string | null,
  loading: boolean
}
export const LoadingContainer: React.FC<LoadingContainerProps> = ( {
  loading, error, children
} ) => {
  return <>
    {loading && 
      <Center>
        <Loading />
      </Center> }
    {!loading && error &&
      <Center>
        <Error error={error} />
      </Center> }
    {!loading && !error && 
      children}
  </>
}

export default Loading;