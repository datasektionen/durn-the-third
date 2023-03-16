import { createStyles, Stack, Table, Text } from "@mantine/core"
import axios from "axios"
import React, { useEffect, useMemo, useState } from "react"
import useAuthorization from "../hooks/useAuthorization"
import { useAPIData } from "../hooks/useAxios"
import { Loading, Error } from "./Loading"
import { Candidate, Election } from "../util/ElectionTypes"

const useStyles = createStyles((theme) => ({
  voteStageBox: {
    border: "1px solid",
    borderRadius: "1rem",
    boxShadow: "1px 1px 3px 3px rgba(0,0,0,0.15)",
    padding: "1rem",
    backgroundColor: "#F7F7F7" 
  }
}))

interface VoteStage {
  blanks: number,
  candidates: {
    name: string,
    votes: number,
    eliminated: boolean
  }[]
}

export interface DisplayResultProps {
  electionId: string
}

export const DisplayResult: React.FC<DisplayResultProps> = (
  {electionId}
) => {
  const [voteStages, loadingStages, stagesError] = useAPIData<VoteStage[]>(
    `/api/election/${electionId}/count`,
    (data) => Promise.resolve(data)
  )

  return <>
    {loadingStages && <>
      <p>
        Counting votes
      </p>
    </>}

    {!loadingStages && stagesError && <>
      <Error error={stagesError}/>
    </>}

    {!loadingStages && !stagesError && voteStages && <>
      {voteStages.map((stage) => <DisplayVoteStage stage={stage} />)}
    </>}
  </>
}

interface DisplayVoteStageProps {
  stage: VoteStage
}

const DisplayVoteStage: React.FC<DisplayVoteStageProps> = ({stage}) => {
  const {classes, cx} = useStyles()
  const totalVotes = useMemo(() => (
    stage.candidates.reduce((prev, elem) => (prev + elem.votes), 0)
  ), [stage])


  return <>
    <div className={classes.voteStageBox} style={{marginTop:"1rem"}}>

      <div style={{marginBottom: "0.5rem"}}>
       <Text>Blanka röster: {stage.blanks}</Text>
      </div>
      <Table striped>
        <thead>
          <tr>
            <th>
              Kandidat
            </th>
            <th>
              Röster
            </th>
            <th>
              Andel
            </th>
          </tr>
        </thead>
        <tbody>
          {stage.candidates.map((candidateResult, index) => (
            <tr key={index}>
              <td><Text 
                td={candidateResult.eliminated && stage.candidates.length > 2 ? "line-through" : ""} 
                fw={candidateResult.eliminated ? 700 : 400}
                fs={candidateResult.eliminated && stage.candidates.length > 2 ? "italic" : "" }
              >
                {candidateResult.name}
              </Text></td>
              <td>{candidateResult.votes}</td>
              <td>{(candidateResult.votes/totalVotes*100).toFixed(2)} %</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  </>
} 


export interface DisplaySchultzeProps {
  election: Election,
  ranking: Candidate[]
}

export const DisplaySchultzeResult: React.FC<DisplaySchultzeProps> = ( {
  election, ranking
} ) => {
  return <>
    <Text align="center">
      Ordinarie
    </Text>
    <Table striped>
      <thead>
        <th style={{ width: "20%" }}> Rank </th>
        <th> Candidate </th>
      </thead>
      <tbody>
        {ranking.slice(0, election.mandates).map((c, i) => <>
          <tr>
            <td>
              {i + 1}
            </td>
            <td>
              {c.name}
            </td>
          </tr>
        </>)}
      </tbody>
    </Table>
    
    <br></br>
    {election.extraMandates > 0 && <>

      <Text align="center">
        Suppleang
      </Text>
      <Table striped>
        <thead>
          <th style={{ width: "20%" }}> Rank </th>
          <th> Candidate </th>
        </thead>
        <tbody>
          {ranking.slice(
              election.mandates, 
              election.mandates + election.extraMandates
            ).map((c, i) => <>
              <tr>
                <td>
                  {i + 1 + election.mandates}
                </td>
                <td>
                  {c.name}
                </td>
              </tr>
            </>)}
        </tbody>
      </Table>
      <br></br>
    </>}
    
    {ranking.length > election.mandates + election.extraMandates && <>

      <hr/>
      <Table striped>
        <thead>
          <th style={{ width: "20%" }}> Rank </th>
          <th> Candidate </th>
        </thead>
        <tbody>
          {ranking.slice(
            election.mandates + election.extraMandates
            ).map((c, i) => <>
            <tr>
              <td>
                {i + 1 + election.mandates + election.extraMandates}
              </td>
              <td>
                {c.name}
              </td>
            </tr>
          </>)}
        </tbody>
      </Table>
    </>}

  </>
}