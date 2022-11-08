import React, { useCallback, useEffect, useState } from "react";
import {
  useParams,
} from "react-router-dom";
import { Header } from "methone"
import axios from "axios";

import { Grid, Container, TextInput, Button, Text, Textarea, ScrollArea, Table, createStyles } from "@mantine/core";
import { useForm } from "@mantine/form";

import { Election, createEmptyElection, NullTime, parseElectionResponse } from "../../util/ElectionTypes";
import useAuthorization from "../../hooks/useAuthorization";
import { DateTimeInput } from "../../components/DateTime";
import { Plus } from "tabler-icons-react";
import { ErrorModal, InformationModal } from "../../components/Information";

const useStyles = createStyles((theme) => { return {
  changed: {
    backgroundColor: "#d3f8d3"
  }
}})


const EditElection: React.FC = () => {
  const electionId = useParams()["id"] ?? ""
  const { authHeader } = useAuthorization()
  const [election, setElection] = useState<Election>(createEmptyElection())
  const [error, setError] = useState(false)
  const [updateSuccess, setSuccess] = useState(false)
  const { classes, cx } = useStyles()
  const form = useForm({
    initialValues: {
      name: "",
      description: "",
      openTime: null as NullTime,
      closeTime: null as NullTime
    }
  })

  const changeOpenTime = (value: NullTime) => {
    form.setFieldValue("openTime", value)
  }
  const changeCloseTime = (value: NullTime) => {
    form.setFieldValue("closeTime", value)
  }

  const submitChanges = useCallback(form.onSubmit((values) => {
    axios.patch(`/api/election/${electionId}/edit`, values, {
      headers: authHeader
    }).then(({data}) => {
      setElection(parseElectionResponse(data))
      setSuccess(true)
    }).catch(() => {
      setError(true)
    })
  }), [form])

  useEffect(() => {
    axios(`/api/election/${electionId}`, {
      headers: authHeader
    }).then(({ data }) => {
      setElection(parseElectionResponse(data))
    })
  }, [authHeader])
  
  useEffect(() => {
    form.setValues({
      name: election.name,
      description: election.description,
      openTime: election.openTime,
      closeTime: election.closeTime
    })
  }, [election])

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
    <ErrorModal error="Failed to submit election changes to server" 
      opened={error} onClose={()=>{setError(false)}}
    />
    <InformationModal info="Election updated"
      opened={updateSuccess} onClose={() => { setSuccess(false) }}
    />
    <form onSubmit={submitChanges}>
      <Container my="md">
        <Grid align="center">
          <Grid.Col span={1}>
            <Text align="right" fz="lg" fw={700}>Titel: </Text>
          </Grid.Col>
          <Grid.Col span={9}>
            <TextInput size="lg" {...form.getInputProps("name")}/>
          </Grid.Col>
          <Grid.Col span={2} >
            <Button fullWidth type="submit">
              Uppdatera
            </Button>
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={3}>
            <div style={{ marginBottom: "1rem" }} >
              <DateTimeInput
                label="Valet öppnar"
                onChange={changeOpenTime}
                defaultDate={election.openTime}
              />
            </div>
            <div>
              <DateTimeInput
                label="Valet stänger"
                onChange={changeCloseTime}
                defaultDate={election.closeTime}
              />
            </div>
          </Grid.Col>

          <Grid.Col span={9}>
            <Textarea {...form.getInputProps("description")} />

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
    </form>
  </>
}



export default EditElection