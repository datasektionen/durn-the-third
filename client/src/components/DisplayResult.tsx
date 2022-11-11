import { createStyles, Stack, Table, Text } from "@mantine/core"
import axios from "axios"
import React, { useEffect, useMemo, useState } from "react"
import useAuthorization from "../hooks/useAuthorization"

const useStyles = createStyles((theme) => ({
  voteStageBox: {
    border: "1px solid",
    borderRadius: "1rem",
    padding: "1rem"
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [voteStages, setVoteStages] = useState<VoteStage[]>([])
  const { authHeader } = useAuthorization()
  
  useEffect(() => {
    if ("Authorization" in authHeader) {
      axios(`/api/election/${electionId}/count`,{
        headers: authHeader
      }).then(({data}) => {
        setLoading(false)
        setError(null)
        setVoteStages(data)
      }).catch(({response}) => {
        setError(response.data)
      })
    }
  }, [authHeader])

  return <>
    {loading && <>
      <p>
        Counting votes
      </p>
    </>}

    {error && <>
      
    </>}

    {!loading && !error && <>
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

      <Text>Blanka röster: {stage.blanks}</Text>
      <Table striped >
        <thead>
          <th>
            Kandidat
          </th>
          <th>
            Röster
          </th>
          <th>
            Andel
          </th>
        </thead>
        {stage.candidates.map((candidateResult, index) => (
          <tr>
            <td><Text 
              td={candidateResult.eliminated && index < stage.candidates.length-1? "line-through" : ""} 
              fw={candidateResult.eliminated ? 700 : 400}
            >
              {candidateResult.name}
            </Text></td>
            <td>{candidateResult.votes}</td>
            <td>{(candidateResult.votes/totalVotes*100).toFixed(2)} %</td>
          </tr>
        ))}
      </Table>
    </div>
  </>
} 