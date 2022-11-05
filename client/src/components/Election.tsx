import React, { useEffect, useState } from "react";
import useAuthorization from "../hooks/useAuthorization";

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
  openTime: Date | null,
  closeTime: Date | null,
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

export const DisplayElectionInfo: React.FC<{ election: Election, modalContent: React.FC<{election: Election}> }> = (props) => {
  const { classes, cx } = useStyle()
  const [hovering, setHovering] = useState(false)

  return <>
    <div
      className={cx(constants.themeColor, "lighten-4", hovering ? classes.electionBoxHover : classes.electionBox)}
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