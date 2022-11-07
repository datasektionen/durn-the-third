import React, { useEffect, useState } from "react";
import {
  useParams,
} from "react-router-dom";
import { Header } from "methone"
import axios from "axios";

import { Grid, Skeleton, Container } from "@mantine/core";
import { useForm } from "@mantine/form";

import { Election, Candidate, electionMock } from "../../components/Election";
import useAuthorization from "../../hooks/useAuthorization";

const EditElection: React.FC = () => {
  const electionId = useParams()["id"]
  const [election, setElection] = useState<Election>(electionMock())
  const { authHeader } = useAuthorization()

  axios(`/api/election/${electionId}`, {
    headers: authHeader
  }).then((res) => {
    setElection(res.data)
  })

  const form = useForm({
    initialValues: {
      name: election.name,
      description: election.description,
      openTime: election.openTime,
      closeTime: election.closeTime
    }
  })

  return <>
    <Header title="Editing election" />
    <Container my="md">
      <Grid>
        <Grid.Col span={3}>
          
        </Grid.Col>
        <Grid.Col span={9}>
          <Skeleton height={200} animate={false}/>
        </Grid.Col>
      </Grid>
    </Container>
  </>
}


export default EditElection