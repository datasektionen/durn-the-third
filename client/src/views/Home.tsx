import React, { useEffect, useState } from "react";
import { Header } from "methone";
import { Grid, Skeleton, Container } from "@mantine/core";
import { electionMock, DisplayElectionInfo, Election } from "../components/Election";

const Info: React.FC = () => {
  return <Skeleton height={300} animate={false}> </Skeleton>
}

const getElections = (): Election[] =>  {
  return [electionMock(), electionMock(), electionMock()];
}

export const Home: React.FC = (props) => {
  const [elections, setElections] = useState<Election[]>([]);
  useEffect(() => {
    setElections(getElections());
  });

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