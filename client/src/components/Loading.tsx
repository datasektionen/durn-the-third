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
      <Loading />}
    {!loading && error &&
      <Error error={error} />}
    {!loading && !error && 
      children}
  </>
}

export default Loading;