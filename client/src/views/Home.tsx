import React, { useEffect, useState } from "react";
import { Header } from "methone";
import axios from "axios";

import { Grid, Container, createStyles, Center} from "@mantine/core";

import { DisplayElectionInfo } from "../components/ElectionInfo";
import { Election, ElectionSchema, parseElectionResponse } from "../util/ElectionTypes"
import { Voting } from "../components/Voting";
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

      <h4><b>Vad är ett urnval?</b></h4>
      <p>
        Urnval är en sorts personval där man rankar kandidaterna istället för att rösta om dem en i taget. 
        Datasektionen använder det för posterna Sektionsordförande, Vice Sektionsordförande, samt Kassör.
      </p>

      <h4><b>Hur röstar man i urnvalet?</b></h4>
      <p>
        Genom att klicka på en av rutorna ovan (om några val är öppna), och sedan rangordna kadidaterna i den ordningen man vill. 
      </p>

      {/* <h4><b>Hur räknas rösterna i urnvalet?</b></h4>
      <p>
        Exakt hur rösterna räknas bestäms av <></>
        <a href="https://styrdokument.datasektionen.se/reglemente">sektionens reglemente</a>, 
        i §3.12.7, som säger att de ska räknas med algoritmen <></>
        <a href="https://sv.wikipedia.org/wiki/Alternativr%C3%B6stning">Alternativomröstning</a>, 
        där man även kan rangordna <em>Blank</em> och <em>Vakans</em>.
        Den kan sammanfattas som:
        <ul>
          <li>Varje valsedel ger sin röst till den kandidat som är högst rankad.</li>
          <li>Den kandidat med minst antal röster stryks ur valet.</li>
          <li>Om en valsedels högst rankade kandidat är struken ur valet, ges rösten till den högst rankade kandidaten som inte är struken.</li>
          <li><em>Vakans</em> kan aldrig strykas.</li>
          <li>Om en röstsedel har rankat <em>Blank</em> högst så kommer den räknas som en blankröst framöver.</li>
          <li>När en kandidat har en majoritet av rösterna så har den vunnit valet.</li>
        </ul>
      </p> */}
      {/* <br /> <br />  */}
      <h4><b>Frågor eller tekniska problem?</b></h4>

      <p>
        Kontakta vaberedningen (<a href="mailto:valberedningen@datasektionen.se">valberedningen@datasektionen.se</a>)
        eller Systemansvarig (<a href="mailto:d-sys@datasektionen.se">d-sys@datasektionen.se</a>)
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
    <Header title="dUrn - digitala urnval" />
    
    <div style={{marginTop: "2rem"}}>
      <Container my="md">
        {!loggedIn &&
          <Center>
            <p className={cx(constants.themeColor, "lighten-4", classes.alertBox)}>
              Log in to see all open elections.
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
                  There are currently no open urnval.
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