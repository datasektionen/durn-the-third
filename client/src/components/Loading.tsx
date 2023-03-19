import { Center, createStyles, Text } from "@mantine/core"
import React from "react"
import { PacmanLoader } from "react-spinners"

const useStyles = createStyles((theme) => ({
  error: {
    margin: "2rem",
    padding: "2rem",
    paddingTop: "1rem",
    textAlign: "center",
    borderRadius: "0.6rem",
    backgroundColor: "#ffcccb"
  },

}));

export const Loading: React.FC = () => {

  return <>
    <PacmanLoader color="#5c6bc0" />
  </>
}

export interface ErrorProps {
  error: string
}
export const Error: React.FC<ErrorProps> = ({ error }) => {
  const {classes} = useStyles();
  return <>
    <div className={classes.error}>
      <Text fw={700}>
        Error 
      </Text>
      {error}
    </div>
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
    {!loading && !error && (children ?? <></>)}
  </>
}

export default Loading;