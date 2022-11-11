import { createStyles, Stack, Table, Text } from "@mantine/core"
import axios from "axios"
import React, { useEffect, useMemo, useState } from "react"
import useAuthorization from "../hooks/useAuthorization"

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

      <div style={{marginBottom: "0.5rem"}}>
       <Text>Blanka röster: {stage.blanks}</Text>
      </div>
      <Table striped>
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
        <tbody>
          {stage.candidates.map((candidateResult) => (
            <tr>
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