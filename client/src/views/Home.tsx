import React, { useEffect, useState } from "react";
import { Header } from "methone";
import axios from "axios";

import { Grid, Text, Container, createStyles} from "@mantine/core";

import { DisplayElectionInfo } from "../components/Election";
import { Election, parseElectionResponse } from "../util/ElectionTypes"
import { Voting } from "../components/Voting";
import useAuthorization from "../hooks/useAuthorization";
import constants from "../util/constants";

const useStyles = createStyles((theme) => ({
  infoBox: {
    borderRadius: "0.5rem",
    padding: "2rem",
  }
}))

const Info: React.FC = () => {
  const { classes, cx } = useStyles()
  return <div className={cx(constants.themeColor, "lighten-4", classes.infoBox)}>
    <p>
      Om det finns några publicerade val så ser du dem nedan. <br />
      <br />
      Vid frågor, kontakta vaberedningen (<a href="mailto:valberedningen@datasektionen.se">valberedningen@datasektionen.se</a>)
      eller IOR (<a href="mailto:ior@d.kth.se">ior@d.kth.se</a>)
    </p>
  </div>
}

export const Home: React.FC = () => {
  const [elections, setElections] = useState<Election[]>([]);
  const {authHeader} = useAuthorization()
  useEffect(() => {
    axios(`/api/elections/public`, {
      headers: authHeader
    }).then(({data}) => {
      setElections(data.map(parseElectionResponse))
    }).catch(()=>{})
  }, [authHeader]);

  return (<>
    <Header title="dUrn - digitala urnval" />
    
    <div>
      <Container my="md">
        <Grid>
          <Grid.Col xs={12}>{<Info />}</Grid.Col>
          {elections.map((e) => 
            <Grid.Col xs={4}>{<DisplayElectionInfo election={e} ModalContent={Voting}/>}</Grid.Col>
          )}
        </Grid>
      </Container>
    </div>  
    
  </>)
}