import React, { useEffect, useState } from "react";
import { Header } from "methone";
import axios from "axios";

import { Grid, Skeleton, Container } from "@mantine/core";

import { DisplayElectionInfo } from "../components/Election";
import { electionMock, Election, parseElectionResponse } from "../util/ElectionTypes"
import { Voting } from "../components/Voting";
import useAuthorization from "../hooks/useAuthorization";

const Info: React.FC = () => {
  return <Skeleton height={300} animate={false}> </Skeleton>
}

const getMockElections = (): Election[] =>  {
  return [electionMock(), electionMock(), electionMock()];
}

export const Home: React.FC = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const {authHeader} = useAuthorization()
  useEffect(() => {
    console.log(authHeader)
    axios(`/api/elections/public`, {
      headers: authHeader
    }).then(({data}) => {
      setElections(data.map(parseElectionResponse))
    }).catch(() => {
      // setElections(getMockElections());
    })
  }, [authHeader]);

  return (<>
    <Header title="Hem" />
    
    <div>
      <Container my="md">
        <Grid>
          <Grid.Col xs={12}>{<Info />}</Grid.Col>
          {elections.map((e) => 
            <Grid.Col xs={4}>{<DisplayElectionInfo election={e} modalContent={Voting}/>}</Grid.Col>
          )}
          
        </Grid>
      </Container>
    </div>  
    
  </>)
}