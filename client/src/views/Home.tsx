import React, { useEffect, useState } from "react";
import { Header } from "methone";
import { Grid, Skeleton, Container } from "@mantine/core";

const Info: React.FC = () => {
  return <Skeleton height={300} animate={false}> </Skeleton>
}


interface Election {
  a?: number
}

const ElectionInfo: React.FC<{ election: Election }> = (props) => {
  return <Skeleton height={230} animate={false}> </Skeleton>;
}


const getElections = (): Election[] =>  {

  return [{a:3}, {}, {}];
}


export const Home: React.FC = (propps) => {

  const [elections, setElections]= useState<Election[]>([]);
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