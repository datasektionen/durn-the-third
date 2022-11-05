import React, { useEffect, useState } from "react";
import { Header } from "methone";
import { Grid, Skeleton, Container, createStyles } from "@mantine/core";
import { electionMock, DisplayElectionInfo, Election } from "../components/Election";
import axios from "axios";
import useAuthorization from "../hooks/useAuthorization";

const Info: React.FC = () => {
  return <Skeleton height={300} animate={false}> </Skeleton>
}

const getElections = (): Election[] =>  {
  return [electionMock(), electionMock(), electionMock()];
}

export const Home: React.FC = (props) => {
  const [elections, setElections] = useState<Election[]>([]);
  const {authHeader} = useAuthorization()
  useEffect(() => {
    axios(`/api/elections/public`, {
      headers: authHeader
    }).then((res) => {
      console.log(res.data)
      setElections(res.data)
    }).catch((reason) => {
      console.log(reason.message)
      setElections(getElections());
    })
  }, [authHeader]);

  return (<>
    <Header title="Hem" />
    
    <div>
      <Container my="md">
        <Grid>
          <Grid.Col xs={12}>{<Info />}</Grid.Col>
          {
            elections.map(e => 
              <Grid.Col xs={4}>{<ElectionInfo election={e}/>}</Grid.Col>)
          }
          
        </Grid>
      </Container>
    </div>  
    
  </>)
}