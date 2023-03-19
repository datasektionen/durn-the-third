import React from "react";
import { Header } from "methone"

import { useNavigate } from "react-router-dom";
import { Center, Container, createStyles, Grid } from "@mantine/core";

import useAuthorization from "../../hooks/useAuthorization";
import { Election, ElectionSchema, parseElectionResponse } from "../../util/ElectionTypes";
import { useAPIData, useApiRequester } from "../../hooks/useAxios";
import { DisplayElectionInfo } from "../../components/ElectionInfo";
import { z } from "zod";
import Loading, { Error } from "../../components/Loading";


const Admin: React.FC = () => {
  const { adminRead } = useAuthorization();
  const navigate = useNavigate();
  const [elections, electionsLoading, electionsError] = useAPIData<Election[]>(
    `/api/elections`,
    (data) => z.array(ElectionSchema).parseAsync(data.map(parseElectionResponse))
  );

  return <> {adminRead && <>
    <Header title="Administrera val" action={{
      onClick: () => navigate("/admin/create"),
      text: "Create election"
    }} />

    <Container my="md">
      {electionsLoading &&
        <Center> <Loading /> </Center>}
      {!electionsLoading && electionsError &&
        <Center> <Error error="Unauthorized"/> </Center>}
      {!electionsLoading && !electionsError && elections &&
        <Grid>
          {elections.reverse().map((election) => (
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