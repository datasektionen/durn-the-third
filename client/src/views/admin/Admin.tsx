import React from "react";
import { Header } from "methone"

import { useNavigate } from "react-router-dom";
import { Center, Container, createStyles, Grid } from "@mantine/core";

import useAuthorization from "../../hooks/useAuthorization";
import { Election, ElectionSchema, parseElectionResponse } from "../../util/ElectionTypes";
import { useAPIData, useApiRequester } from "../../hooks/useAxios";
import { DisplayElectionInfo } from "../../components/ElectionInfo";
import { z } from "zod";
import Loading from "../../components/Loading";

const useStyles = createStyles((theme) => ({
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
}))

const Admin: React.FC = () => {
  const { adminRead } = useAuthorization();
  const { classes, cx } = useStyles();
  const navigate = useNavigate();
  const [elections, electionsLoading, electionsError] = useAPIData<Election[]>(
    `/api/elections`,
    (data) => z.array(ElectionSchema).parseAsync(data.map(parseElectionResponse))
  );

  const createElection = () => {
    navigate("/admin/create");
  }

  if (!adminRead) navigate("/", { replace: true })

  console.log(electionsError)
  return <> {adminRead && <>
    <Header title="Administrera val" action={{
      onClick: createElection, text: "Create election"
    }} />

    <Container my="md">
      {electionsLoading &&
        <Center> <Loading /> </Center>}
      {!electionsLoading && electionsError &&
        <Center> Error </Center>}
      {!electionsLoading && !electionsError && elections &&
        <Grid>
          {elections.map((election) => (
            <Grid.Col md={4}>
              <DisplayElectionInfo
                election={election}
                redirectURL={`/admin/election/${election.id}`}
                />
            </Grid.Col>
          ))}
        </Grid>}
    </Container>
  </>} </>
}

export default Admin