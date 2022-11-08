import React, { useEffect, useState } from "react";
import axios from "axios";

import { createStyles, Modal } from "@mantine/core";

import useAuthorization from "../hooks/useAuthorization";
import constants from "../util/constants";
import { Election, electionMock } from "../util/ElectionTypes";

const useStyle = createStyles((theme) => {
  return {
    electionTitle: {
      fontFamily: "lato",
      marginTop: "0",
      marginBottom: "0",
      backgroundColor: "#eeeeee",
      padding: "0.8rem",
      borderRadius: "0.2rem",
    },
    electionBox: {
      boxShadow: "3px 3px 2px 2px rgba(0,0,0,0.15)",
      position: "relative",
      padding: "1rem",
      borderRadius: "0.2rem",
    },
    electionBoxHover: {
      boxShadow: "3px 3px 5px 5px rgba(0,0,0,0.15)",
      position: "relative",
      padding: "1rem",
      borderRadius: "0.2rem",
    },
    candidateText: {
      marginTop: "1.6rem",
      marginLeft: "1rem",
    }, 
    electionDescription: {
      marginTop: "1.6rem",
      marginLeft: "1rem",
    }
  }
})


export const DisplayElectionInfo: React.FC<{ election: Election, modalContent: React.FC<{election: Election}> }> = (props) => {
  const { classes, cx } = useStyle()
  const [hovering, setHovering] = useState(false)
  const [opened, setOpened] = useState(false)

  return <>
    <Modal centered 
      opened={opened} 
      onClose={() => setOpened(false)} 
      title={
        <h2>{props.election.name}</h2>
      } 
      closeOnClickOutside={false}
      overlayOpacity={0.2}
      size="600px"
    >
      <props.modalContent election={props.election} />
    </Modal>
    <div
      className={cx(constants.themeColor, "lighten-4", hovering ? classes.electionBoxHover : classes.electionBox)}
      onClick={() => setOpened(true)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      
      <div className={classes.electionTitle}>
        <h3 className={classes.electionTitle}>{props.election.name}</h3>
      </div>
      <p className={classes.electionDescription}>
        {props.election.description}
      </p>
      <p className={classes.candidateText}>
        {`${props.election.candidates.length - props.election.candidates.filter((c)=>!c.symbolic).length} kandidater`}
      </p>
    </div>
  </>
}

export const ElectionInfo: React.FC<{ electionId: string, modalContent: React.FC<{ election: Election }> }> = (props) => {
  const [election, setElection] = useState<Election>(electionMock())
  const {authHeader} = useAuthorization()  

  useEffect(() => {
    axios( `/election/${props.electionId}`, {
      headers: authHeader
    }).then((res) => {
      setElection(res.data)
    })
  }, [props.electionId])

  return <DisplayElectionInfo election={election} modalContent={props.modalContent} />
}
