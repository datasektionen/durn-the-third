import React, { useEffect, useState } from "react";
import axios from "axios";

import { createStyles, Modal } from "@mantine/core";

import useAuthorization from "../hooks/useAuthorization";
import constants from "../util/constants";
import { NullTime } from "./DateTime";

export interface Candidate {
  id: string,
  name: string,
  presentation: string,
  symbolic: boolean
}

export interface Election {
  id: string,
  name: string,
  description: string,
  published: boolean,
  finalized: boolean,
  openTime: NullTime,
  closeTime: NullTime,
  candidates: Array<Candidate>,
}

export const electionMock = (): Election => {
  return {
    id: "fd9d7c4a-ee20-4b63-ae44-cc5760f3d493",
    name: "test",
    description: "thing",
    published: true,
    finalized: false,
    openTime: new Date("2022-10-30T00:14:31Z"),
    closeTime: new Date("2023-10-30T00:14:31Z"),
    candidates: [
      {
        id: "724619af-aa6b-4299-ae25-5307904d8636",
        name: "adsfasdfasdfasdfasdfadsfadfsafasdfsadf",
        presentation: "https://dsekt.se/data",
        symbolic: false
      },
      {
        id: "937e4bfe-d0e7-4390-b73e-e36219e838a4",
        name: "adsf2",
        presentation: "https://dsekt.se/niklas",
        symbolic: false
      },
      {
        id: "asdfasfd-d0e7-4390-b73e-e36219e838a4",
        name: "Vakant",
        presentation: "",
        symbolic: true
      },
      {
        id: "sadfasdf-d0e7-4390-b73e-e36219e838a4",
        name: "Blank",
        presentation: "",
        symbolic: true
      }
    ]
  }
}

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
      {/* {props.election.candidates.map((candidate) => <>
        <div className={classes.candidate}>
          <p className={classes.candidateText}>{candidate.name}</p>
        </div>
      </>)} */}
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