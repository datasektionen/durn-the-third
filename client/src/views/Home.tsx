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
    borderRadius: "0.3rem",
    padding: "2rem",
    marginTop: "10rem"
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

      <h4><b>Hur räknas rösterna i urnvalet?</b></h4>
      <p>
        Exakt hur rösterna räknas bestäms av <></>
        <a href="https://styrdokument.datasektionen.se/reglemente">sektionens reglemente</a>, 
        i §3.12.7., som säger att de ska räknas med algoritmen <></>
        <a href="https://sv.wikipedia.org/wiki/Alternativr%C3%B6stning">Alternativomröstning</a>, 
        där man även kan rangordna <em>Blank</em> och <em>Vakans</em>.
        Den kan sammanfattas som:
        <ul>
          <li>Varje valsedel ger sin röst till den kandidat som är högst rankad.</li>
          <li>Den kandidat med minst antal röster stryks ur valet.</li>
          <li>Om en valsedels högst rankade kandidat är struken ur valet, ge rösten till den högst rankade kandidaten som inte är struken.</li>
          <li><em>Vakans</em> kan aldrig strykas.</li>
          <li>Om en röstsedel har rankat <em>Blank</em> högst så kommer den räknas som en blankröst framöver.</li>
          <li>När en kandidat har en majoritet av rösterna så har den vunnit valet.</li>
        </ul>
      </p>
      {/* <br /> <br />  */}
      <h4><b>Frågor eller tekniska problem?</b></h4>

      <p>
        Vid frågor, kontakta vaberedningen (<a href="mailto:valberedningen@datasektionen.se">valberedningen@datasektionen.se</a>)
        eller Systemansvarig (<a href="mailto:d-sys@datasektionen.se">d-sys@datasektionen.se</a>)
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
          {elections.map((e) => 
            <Grid.Col xs={4}>{<DisplayElectionInfo election={e} ModalContent={Voting}/>}</Grid.Col>
            )}
          {/* <Grid.Col xs={12}>{}</Grid.Col>l */}
        </Grid>
        <Info />
      </Container>
    </div>  
    
  </>)
}