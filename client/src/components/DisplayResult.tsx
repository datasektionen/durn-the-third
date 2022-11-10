import { createStyles } from "@mantine/core"
import axios from "axios"
import React, { useEffect, useState } from "react"
import useAuthorization from "../hooks/useAuthorization"

const useStyles = createStyles((theme) => ({
  voteStageBox: {
    border: "1px solid"
  }
}))

interface VoteStage {
  blanks: number,
  candidates: {
    name: string,
    Votes: number,
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
    axios(`/api/election/${electionId}/count`,{
      headers: authHeader
    }).then(({data}) => {
      setLoading(false)
      setVoteStages(data)
    }).catch(({response}) => {
      setError(response.data)
    })
  }, [authHeader])

  
  return <>
    {loading && <>
      <p>
        loading results
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

  return <>
    <div className={classes.voteStageBox}>

    </div>
  </>
} 