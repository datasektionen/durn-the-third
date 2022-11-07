import React, { useEffect, useState } from "react";
import {
  useParams,
} from "react-router-dom";
import { Header } from "methone"
import axios from "axios";

import { Grid, Skeleton, Container, TextInput, Button, Text, Textarea, ScrollArea, Table, createStyles } from "@mantine/core";
import { useForm } from "@mantine/form";
import { DatePicker, TimeInput} from '@mantine/dates';

import { Election, Candidate, electionMock } from "../../components/Election";
import useAuthorization from "../../hooks/useAuthorization";
import { DateTimeInput } from "../../components/DateTime";
import { Plus } from "tabler-icons-react";

const useStyles = createStyles((theme) => { return {
  changed: {
    backgroundColor: "#d3f8d3"
  }
}})


const EditElection: React.FC = () => {
  const electionId = useParams()["id"]
  const [election, setElection] = useState<Election>(electionMock())
  const { authHeader } = useAuthorization()
  const { classes, cx } = useStyles()


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

  const candidates = election.candidates
    .filter((candidate) => !candidate.symbolic)
    .map((candidate) => (
      <tr>
        <td></td>
        <td>
          <TextInput value={candidate.name} />
        </td>
        <td>
          <TextInput value={candidate.presentation} />
        </td>
      </tr>
    ))

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
            <DateTimeInput
              label="Valet öppnar"
              onChange={() => { }}
              defaultDate={election.openTime}
            />
          </div>
          <div>
            <DateTimeInput
              label="Valet stänger"
              onChange={() => {}}
              defaultDate={election.closeTime}
            />
          </div>
        </Grid.Col>

        <Grid.Col span={9}>
          <Textarea {...form.getInputProps("description")}></Textarea>

          <div style={{marginTop: "1rem"}}>
            <ScrollArea>
              <Table withBorder withColumnBorders>
                <thead>
                  <tr>
                    <th style={{ width: 30 }}></th>
                    <th>
                      <Text style={{ margin: "1rem" }} align="center">
                        Kandidatens namn
                      </Text>
                    </th>
                    <th>
                      <Text style={{ margin: "1rem" }} align="center">
                        Kandidatpresentation
                      </Text>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {candidates}

                  <tr>
                    <td><Button compact fullWidth>
                      <Plus />
                    </Button></td>
                    <td>
                      <TextInput />
                    </td>
                    <td>
                      <TextInput />
                    </td>
                  </tr>
                </tbody>
              </Table>
            </ScrollArea>
          </div>
        </Grid.Col>
      </Grid>
    </Container>
  </>
}



export default EditElection