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
        <h3>What is this system?</h3>
        <p>
          Durn is a system for allowing voting in an election over a extended period of time using ranked ballots.
          We use this system for the posts "Ordförande", "Vice Ordförande", "Kassör" and "Kårfullmäktige". 
          This is the third iteration of this system, the first having been hacked together in a short time
          and then stopped working after running for a few years, and the second never being finished.
        </p>

        <h3>How are the votes counted?</h3>
        <p>
          Exactly how our urnval is supposed to work is described in 
          our <a href="https://styrdokument.datasektionen.se/reglemente">reglemente</a> in <i>§3.12.7 Urnval</i>.
          <br /><br />
          The system uses a vote counting algorithm called the "Shultze Method", which operates on ranked ballots. It has quite
          a few desirable properties, one of the major ones for our interests being that it produces a ranking of the candidates.
          Exactly how it works and all of the properties it has is described in 
          its <a href="https://en.wikipedia.org/wiki/Schulze_method">Wikipedia article</a>, 
          which is very throughout and descriptive and describes it much better than what could fit here.
        </p>

        <h3>Why can't my vote be changed after voting?</h3>
        <p>
          This is not true anymore, it is now possible to change your vote.
        </p>

        {/* <p>
          This is due to a balancing of the interests of security and having a good user experience. The simple solution
          for allowing this would be to store which user made each vote in the database. This would however allow anyone with
          database access (through a leak or admin access) to see what any and all persons voted for. A possible idea for
          a solution for this would be to introduce some kind of hash of the users information, and instead store that. 
          However, we don't have access to any kind of information to create this hash that isn't either public or not permanent, or easily bruteforced.
          This could be solved by having the user provide some kind of information on their own that could be used. This would
          effectively be the same as the user creating a password used for voting. However, this is somewhat overkill, and 
          having such a password was one of the bigger usability complaints for the previous system. It also brings with it all
          the security problems with people choosing weak passwords, or possibly even reusing them from other places.
          The last point in particular brings a lot of responsibility in regards to the security of the system.
          <br/><br/>
          This is not a perfect solution, and is a balancing of interests, how this is implemented could be changed in the future.
        </p> */}

        <h3>Source Code</h3>
        In order to be as transparent as possible, the source code for the system is available 
        at <a href="https://github.com/datasektionen/durn-the-third">github</a>.
      </div>
    </Container>
  </>
}

export default Info;