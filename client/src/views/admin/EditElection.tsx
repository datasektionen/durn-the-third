import React, { useEffect, useState } from "react";
import {
  useParams,
} from "react-router-dom";
import { Header } from "methone"
import axios from "axios";

import { Grid, Skeleton, Container, TextInput, Button, Text, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";
import { DatePicker, TimeInput} from '@mantine/dates';

import { Election, Candidate, electionMock } from "../../components/Election";
import useAuthorization from "../../hooks/useAuthorization";
import { DateTimeInput } from "../../components/DateTime";

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
    <Header title="Redigerar val" />
    <Container my="md">
      <Grid align="center">
        <Grid.Col span={1}>
          <Text align="right" fz="lg" fw={700}>Titel: </Text>
        </Grid.Col>
        <Grid.Col span={9}>
          <TextInput size="lg" {...form.getInputProps("name")}/>
        </Grid.Col>
        <Grid.Col span={2} >
          <Button fullWidth>
            Uppdatera
          </Button>
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={3}>
          <div style={{ marginBottom: "1rem" }}>
            <DateTimeInput label="Valet Stänger" onChange={() => { }} defaultDate={null} />
          </div>
          <div>
            <DateTimeInput label="Valet Stänger" onChange={() => {}} defaultDate={null}/>
          </div>
        </Grid.Col>

        <Grid.Col span={9}>
          <Textarea {...form.getInputProps("description")}></Textarea>
        </Grid.Col>
      </Grid>
    </Container>
  </>
}



export default EditElection