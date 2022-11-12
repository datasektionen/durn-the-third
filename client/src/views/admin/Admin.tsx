import React, { useEffect, useState } from "react";
import axios from "axios";
import { Header } from "methone"

import { useNavigate } from "react-router-dom";
import { Container, createStyles, Grid } from "@mantine/core";

import useAuthorization from "../../hooks/useAuthorization";
import { Election, parseElectionResponse } from "../../util/ElectionTypes";
import { useApiRequester } from "../../hooks/useAxios";
import { DisplayElectionInfo } from "../../components/Election";
import constants from "../../util/constants"
import { ErrorModal } from "../../components/PopupModals";

const useStyles = createStyles((theme) => { return {
  electionBox: {
    boxShadow: "3px 3px 2px 2px rgba(0,0,0,0.15)",
    position: "relative",
    padding: "1rem",
    borderRadius: "0.2rem",
    ":hover": {
      boxShadow: "3px 3px 5px 5px rgba(0,0,0,0.15)",
      position: "relative",
      padding: "1rem",
      borderRadius: "0.2rem",
    }
  }
}})

const Admin: React.FC = () => {
  const { adminRead, authHeader } = useAuthorization()
  const [elections, setElections] = useState<Election[]>([])
  const client = useApiRequester()
  const [error, setError] = useState<string | null>(null)
  const { classes, cx } = useStyles()
  const navigate = useNavigate()


  useEffect(() => {
    client("get", "/api/elections", {}, (data) => {
      setElections(data.map(parseElectionResponse))
    })
  }, [authHeader])

  const createElection = () => {
    axios.post("/api/election/create", {}, {
      headers:authHeader
    }).then(({data}) => {
      navigate(`/admin/election/${data}`)
    }).catch(({response}) => {
      setError(response.data)
    })
  }

  if (!adminRead) navigate("/", { replace: true })

  return <> {adminRead && <>
    <Header title="Administrera val" action={{
      onClick: createElection, text: "Skapa Nytt Val"
    }} />
    <ErrorModal opened={error != null} error={
      `Server responded with: ${error ?? ""}`
    } onClose={()=>setError(null)} />
    <Container my="md">
      <Grid>
        {elections.map((election) => (
          <Grid.Col span={4}>
            <DisplayElectionInfo
              election={election}
              redirectURL={`/admin/election/${election.id}`}
            />
          </Grid.Col>
        ))}
      </Grid>
    </Container>
  </>} </>
}

export default Admin