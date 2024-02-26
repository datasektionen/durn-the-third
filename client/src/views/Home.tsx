import React, { useEffect, useState } from "react";
import { Header } from "methone";
import axios from "axios";

import { Grid, Container, createStyles, Center} from "@mantine/core";

import { DisplayElectionInfo } from "../components/ElectionInfo";
import { Election, ElectionSchema, parseElectionResponse } from "../util/ElectionTypes"
import useAuthorization from "../hooks/useAuthorization";
import constants from "../util/constants";
import { useAPIData } from "../hooks/useAxios";
import { z } from "zod";
import Loading, { Error } from "../components/Loading";

const useStyles = createStyles((theme) => ({
  infoBox: {
    borderRadius: "0.3rem",
    padding: "2rem",
    marginTop: "10rem"
  },

  alertBox: {
    borderRadius: "0.3rem",
    padding: "3rem",
    marginTop: "3rem",
    fontSize: "x-large"
  }
}))

const Info: React.FC = () => {
  const { classes, cx } = useStyles()
  return <div className={cx(constants.themeColor, "lighten-4", classes.infoBox)}>

    <h4><b>Vad är smUrn?</b></h4>
    <p>
      smUrn är ett digitalt omröstningssystem som är baserat på sektionens system för digitala urnval, dUrn.
      Systemet är primärt ämnat för användning under SM, därav namnet.
    </p>
  
    <h4><b>Hur röstar jag?</b></h4>
    <p>
      Klicka på en tillgänglig omröstning, rangordna dina val och klicka på "Rösta"
    </p>

    <h4><b>Frågor eller tekniska problem?</b></h4>

    <p>
      Kontakta Styrelsen (<a href="mailto:drek@datasektionen.se">drek@datasektionen.se</a>)
      eller Systemansvarig (<a href="mailto:d-sys@datasektionen.se">d-sys@datasektionen.se</a>)
    </p>

    <h4><b>Källkod och övrig information</b></h4>
    <p>
      Källkoden finns tillgänglig på en branch på <a href="https://github.com/datasektionen/durn-the-third">github</a>. Mer information går att finna på <a href="/#/info">infosidan</a>
    </p>
  </div>
}

export const Home: React.FC = () => {
  const { loggedIn } = useAuthorization();
  const { cx, classes } = useStyles();
  const [elections, electionsLoading, electionsError] = useAPIData<Election[]>(
    `/api/elections/public`, 
    (data) => z.array(ElectionSchema).parseAsync(data.map(parseElectionResponse))
  );

  return (<>
    <Header title="smUrn - digitala omröstningar" />
    
    <div style={{marginTop: "2rem"}}>
      <Container my="md">
        {!loggedIn &&
          <Center>
            <p className={cx(constants.themeColor, "lighten-4", classes.alertBox)}>
              Logga in för att se alla tillgängliga omröstningar.
            </p>
          </Center>
        }
        {loggedIn && <>
          {electionsLoading &&
            <Center> <Loading/> </Center>}
          {!electionsLoading && electionsError &&
            <Center> <Error error={electionsError}/> </Center>}
          {!electionsLoading && !electionsError && elections && <>
            {elections.filter((e) => !e.finalized).length == 0 && 
              <Center>
                <p className={cx(constants.themeColor, "lighten-4", classes.alertBox)}>
                  Det finns inga tillgängliga omröstningar.
                </p>
              </Center>}
            <Grid> 
              {elections.filter((e) => !e.finalized).map((e) =>
                <Grid.Col xs={4}>
                  <DisplayElectionInfo election={e} redirectURL={`/vote/${e.id}`} />
                </Grid.Col>
              )} 
            </Grid>
          </>}
        </>}
        <Info />
      </Container>
    </div>  
    
  </>)
}
