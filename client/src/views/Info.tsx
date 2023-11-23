import { Container, createStyles } from "@mantine/core"
import React from "react"
import { Header } from "methone"
import constants from "../util/constants";

const useStyles = createStyles((theme) => ({
  infoBox: {
    borderRadius: "0.3rem",
    padding: "2rem",
    paddingTop: "0.5rem"
  }
}));

const Info: React.FC = () => {
  const {classes, cx} = useStyles();
  return <>
    <Header title="Information"/>

    <Container my="md">
      <div className={cx(constants.themeColor, "lighten-4", classes.infoBox)}>
        <h3>Vad är smUrn?</h3>
        <p>
		    smUrn är ett digitalt omröstningssystem som är baserat på sektionens system för digitala urnval, dUrn.
		    Systemet är primärt ämnat för användning under SM, därav namnet.
		    <br></br>		
		    Detta är tredje (egentligen andra) iterationen av Konglig Datasektionens digitala omrösningssystem.
		    Det första systemet kallades för Mentometer och hackades ihop som hastigast på en pub.
		    Mentometer fungerade bra i flera år tills en omröstning i ett val där systemet gick sönder och alla röster hamnade på vakans.
		    "Osäkert", tänkte alla inblandade och dödade Mentometer.
		    <br></br>	
		    Efter Mentometer gick sektionen över till VoteIT, ett system för stämmor som THS erbjöd alla sektioner.
		    VoteIT fördröjde varje SM med ~1 timme på grund av hur dåligt det fungerade och att de ändrade sin UI mellan varje SM.
		    Det enda bra med VoteIT var att man kunde vinka genom att trycka på en knapp.
		    <br></br>	
		    Hösten 2023 byggdes smUrn till Budget-SM för att slippa VoteIT.
		    smUrn var kraftigt baserat på sektionens digitala urnnvalssystem dUrn som byggdes våren 2023.
        </p>

        <h3>Hur räknas rösterna?</h3>
        <p>
	      Det alternativ som får flest röster är det som vinner. (duh)
		    För att gå in lite på djupet så används något som kallas för "Shulze-Metoden".
		    Exakt hur det fungerar kan man läsa om på <a href="https://en.wikipedia.org/wiki/Schulze_method">Wikipediasidan</a>.
		    "Shulze-Metoden" är egentligen ganska overkill då metoden inte spelar någon roll när det bara finns 2 val men används för att dUrn gör det.
        </p>

        <h3>Varför kan jag inte ändra min röst efter att jag har röstat?</h3>
        <p>
          Numera så går det faktiskt att ändra sin röst.
	  	    Vill man läsa mer om varför dUrn fungerar på det sättet så kan man gå in på dUrns <a href="https://durn.datasektionen.se/#/info">infosida</a>.
        </p>

        <h3>Källkod</h3>
        Källkoden finns tillgänglig på en branch på <a href="https://github.com/datasektionen/durn-the-third">github</a>.
      </div>
    </Container>
  </>
}

export default Info;
