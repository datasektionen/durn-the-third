import { Center, createStyles, Grid, List, Stack, Table, Text } from "@mantine/core"
import axios from "axios"
import React, { useEffect, useMemo, useState } from "react"
import useAuthorization from "../hooks/useAuthorization"
import { useAPIData } from "../hooks/useAxios"
import { Loading, Error } from "./Loading"
import { Candidate, Election } from "../util/ElectionTypes"
import { Star } from "tabler-icons-react"

const useStyles = createStyles((theme) => ({
  voteStageBox: {
    border: "1px solid",
    borderRadius: "1rem",
    boxShadow: "1px 1px 3px 3px rgba(0,0,0,0.15)",
    padding: "1rem",
    backgroundColor: "#F7F7F7" 
  },

  goodBox: {
    backgroundColor: "#b2f2bb"
  },

  badBox: {
    backgroundColor: "#ff8787"
  },

  neutralBox : {
    backgroundColor: "#fff3bf"
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
  ranking: Candidate[],
  voteMatrix: number[][],
  schultzeMatrix: number[][],
  votes: number,
}

export const DisplaySchultzeResult: React.FC<DisplaySchultzeProps> = ( {
  election, ranking, voteMatrix, votes, schultzeMatrix
} ) => {

  const firstSymbolic = useMemo(() => {
    for(let i = 0; i < ranking.length; i++) {
      if (ranking[i].symbolic)
        return i;
    }
    return ranking.length
  }, [ranking])

  const formattedCandidateName = (c: Candidate) => {
    if (c.symbolic) {
      return <Text fw={700}> {c.name} </Text>
    } else {
      return <Text> {c.name} </Text>
    }
  } 

  return <>
    <h3><Center>Röstresultat</Center></h3>

    {firstSymbolic > 0 && <>
      <Text align="center">
        SM föredrog följande alternativ
      </Text>
      <Table striped withColumnBorders>
        <thead>
          <tr>
            <th style={{ width: "6rem" }}> Rank </th>
            <th> Alternativ </th>
          </tr>
        </thead>
        <tbody>
          {ranking.slice(0, Math.min(election.mandates, firstSymbolic)).map((c, i) => <>
            <tr>
              <td>
                {i + 1}
              </td>
              <td>
                {formattedCandidateName(c)}
              </td>
            </tr>
          </>)}
        </tbody>
      </Table>
    </>}

    <br></br>
    {election.extraMandates > 0 && firstSymbolic > election.mandates && <>

      <Text align="center">
        Suppleang
      </Text>
      <Table striped withColumnBorders>
        <thead>
          <tr key="res-head">
            <th style={{ width: "6rem" }}> Rank </th>
            <th> Candidate </th>
          </tr>
        </thead>
        <tbody>
          {ranking.slice(
              election.mandates,
              Math.min(
                election.mandates + election.extraMandates,
                firstSymbolic
              )
            ).map((c, i) => <>
              <tr key={`r-${i}`}>
                <td>
                  {i + 1 + election.mandates}
                </td>
                <td>
                  {formattedCandidateName(c)}
                </td>
              </tr>
            </>)}
        </tbody>
      </Table>
      <br></br>
    </>}
    
    {(ranking.length > election.mandates + election.extraMandates ||
      firstSymbolic < ranking.length) && <>
      <Text align="center">
        SM föredrog INTE följade alternativ
      </Text>
      <Table striped withColumnBorders>
        <thead>
          <tr>
            <th style={{ width: "6rem" }}> Rank </th>
            <th> Alternativ </th>
          </tr>
        </thead>
        <tbody>
          {ranking.slice( Math.min(
              election.mandates + election.extraMandates,
              firstSymbolic
            )).map((c, i) => <>
            <tr>
              <td>
                {i + 1 + 
                  Math.min(
                    election.mandates + election.extraMandates,
                    firstSymbolic
                  )}
              </td>
              <td>
                {formattedCandidateName(c)}
              </td>
            </tr>
          </>)}
        </tbody>
      </Table>
      
      <br/>
      <h3><Center>Röstdata</Center></h3>
      <DisplayVoteData 
        ranking={ranking}
        voteMatrix={voteMatrix}
        votes={votes}
        schultzeMatrix={schultzeMatrix}
      />
    </>}

  </>
}

interface DisplayVoteMatrixProps {
  ranking: Candidate[],
  voteMatrix: number[][],
  schultzeMatrix: number[][],
  votes: number,
}

const DisplayVoteData: React.FC<DisplayVoteMatrixProps> = (
  { ranking, voteMatrix, votes, schultzeMatrix }
) => {
  const labels = ranking.map(( _, i ) => String.fromCharCode(65 + i));
  const { classes } = useStyles();
  const getBoxClass = (a: number, b: number): string => {
    if (a < b) return classes.badBox;
    if (b < a) return classes.goodBox;
    return classes.neutralBox;
  }

  const DisplayMatrix: React.FC<{
    matrix: number[][],
    name: string,
  }> = ({matrix , name}) => <>
    <Table withColumnBorders withBorder>
      <thead>
        <tr>
          <th style={{ width: "2rem" }}></th>
          {labels.map((l) => <th style={{ width: "2rem" }}>
            <Center> {name}[ &bull; , {l}] </Center>
          </th>)}
        </tr>
      </thead>
      <tbody>
        {matrix.map((row, r) => <tr>
          <td><b><Center> {name}[{labels[r]}, &bull; ] </Center></b></td>
          {row.map((cell, c) => <td
            className={ getBoxClass(matrix[r][c], matrix[c][r]) }
          >
            <Center> {
              r == c ? "-" : cell
            } </Center>
          </td>)}
        </tr>)}
      </tbody>
    </Table>
  </>;

  return <>

    <p><b> Totala antalet röster: </b> {votes} </p>
    
    <b>Alternativindex:</b>
    <List style={{margin: "1rem"}}>
      {ranking.map((c, i) => (
        <List.Item icon={<Text fw={700}>{labels[i]} </Text>}>
          {c.name} 
        </List.Item>
      ))}
    </List>

    
    <h4><Text align="center" fw={700}>
      Röstmatris
    </Text></h4>
    <DisplayMatrix matrix={voteMatrix} name="d" />
    <br />
    <Text align="center">
      d[X, Y] is the amount of voters that prefer candidate X over candidate Y 
    </Text>
    
    <br />
    <h4><Text align="center" fw={700}>
      Schulzeresultatmatris
    </Text></h4>
    <DisplayMatrix matrix={schultzeMatrix} name="p" />
    <br />
    <Text align="center">
      p[X, Y] is the strength of the strongest paths from candidate X to candidate Y
    </Text>
    <br />
    <Text>For details regarding how to interpret these matrixes, please refer to 
      the <a href="https://en.wikipedia.org/wiki/Schulze_method" target="_blank">
        Schultze method wikipedia article
      </a>,
      or some other description of the method.
    </Text>

  </>
}
