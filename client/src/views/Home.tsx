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

    <h4><b>What is an urnval?</b></h4>
    <p>
      An urnval is a kind of election where you can vote ahead of time, and where voting is done through a ranking of all candidates. <br />
      In Datasektionen, we use urnval for the posts: "Ordförande", "Vice Ordförande", "Kassör" and "Kårfullmäktige". <br />
      More information about the posts can be found at <a href="https://dfunkt.datasektionen.se">dfunkt.datasektionen.se</a>.
    </p>

    <h4><b>How do I vote?</b></h4>
    <p>
      Click on one of the open elections, rank the candidates in your preferred order, and press "Vote".
    </p>

    <h4><b>Questions or technical problems?</b></h4>

    <p>
      Contact the Election Committee (<a href="mailto:valberedningen@datasektionen.se">valberedningen@datasektionen.se</a>)
      or the System Administrator (<a href="mailto:d-sys@datasektionen.se">d-sys@datasektionen.se</a>)
    </p>

    <h4>Source Code and other Information</h4>
    <p>
      In order for the vote counting system to be as transparent as possible, the full source code 
      is available at <a href="https://github.com/datasektionen/durn-the-third">github</a>. The system and vote counting is
      also described at the <a href="#/info">info page</a>
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