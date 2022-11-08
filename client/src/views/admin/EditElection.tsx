import React, { useCallback, useEffect, useState } from "react";
import {
  useParams,
} from "react-router-dom";
import { Header } from "methone"
import axios from "axios";

import { Grid, Container, TextInput, Button, Text, Textarea, ScrollArea, Table, createStyles, Modal } from "@mantine/core";
import { useForm } from "@mantine/form";

import { Election, createEmptyElection, NullTime, parseElectionResponse, Candidate } from "../../util/ElectionTypes";
import useAuthorization from "../../hooks/useAuthorization";
import { DateTimeInput } from "../../components/DateTime";
import { Plus } from "tabler-icons-react";
import { ErrorModal, InformationModal } from "../../components/Information";

const useStyles = createStyles((theme) => { return {
  changed: {
    backgroundColor: "#d3f8d3"
  },
  adding: {
    backgroundColor: theme.colors.gray[2]
  }
}})

const EditElection: React.FC = () => {
  const electionId = useParams()["id"] ?? ""
  const { authHeader } = useAuthorization()
  const [election, setElection] = useState<Election>(createEmptyElection())
  const [error, setError] = useState(false)
  const [updateSuccess, setSuccess] = useState(false)
  const [openFinalize, setOpenFinalize] = useState(false)
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

  const makeRequest = (method: string, url: string, data: any) => {
    axios({
      method: method,
      url: url,
      data: data,
      headers: authHeader
    }).then(({ data }) => {
      setElection(parseElectionResponse(data))
      setSuccess(true)
    }).catch(() => {
      setError(true)
    })
  }

  const submitChanges = useCallback(form.onSubmit((values) => {
    makeRequest("patch", `/api/election/${electionId}/edit`, values)
  }), [form])

  const finalizeElection = () => {
    setOpenFinalize(false)
    makeRequest("put", `/api/election/${electionId}/finalize`, {})
  }

  const publishElection = () => {
    makeRequest("put", `/api/election/${electionId}/publish`, {})
  }

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

  return <>
    <Header title="Redigerar val" />

    <ErrorModal error="Failed to submit election changes to server" 
      opened={error} onClose={()=>{setError(false)}}
    />

    <InformationModal info="Election updated"
      opened={updateSuccess} onClose={() => { setSuccess(false) }}
    />

    <Modal centered opened={openFinalize} onClose={() => setOpenFinalize(false)} 
      title="Finalisera val"
    >
      <p style={}>
        Vill du finalisera valet? Det går inte att ångra att finalisera ett val.
      </p>
      <Button onClick={finalizeElection}>
        Finalisera
      </Button>
    </Modal>

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
            <div style={{ marginTop: "3rem"}}>
                <Button onClick={publishElection} fullWidth>
                  Publisera
                </Button>
            </div>

            <div style={{ marginTop: "3rem" }}>
              <Button fullWidth disabled={election.finalized} onClick={() => setOpenFinalize(true)}>
                Finalisera
              </Button>
            </div>

            
          </Grid.Col>

          <Grid.Col span={9}>
            <Textarea {...form.getInputProps("description")} />
            <div style={{marginTop: "1rem"}}>
              <CandidateList
                candidates={election.candidates}
                electionId={electionId}
                onCandidateAdded={(candidate) => setElection((election) => {
                  let copy: Election = {...election}
                  copy.candidates.push(candidate)
                  return copy
                })}
              />
            </div>
          </Grid.Col>
        </Grid>
      </Container>
    </form>
  </>
}

interface CandidateListProps {
  candidates: Candidate[]
  electionId: string
  onCandidateAdded: (candidate: Candidate) => void
}

const CandidateList: React.FC<CandidateListProps> = ({ candidates, electionId, onCandidateAdded }) => {
  const { authHeader } = useAuthorization()
  const {classes} = useStyles()
  const [name, setName] = useState("")
  const [presentation, setPresentation] = useState("")

  const addCandidate = useCallback(() => {
    axios.post(`/api/election/${electionId}/candidate/add`, {
      name: name,
      presentation: presentation
    }, {
      headers: authHeader
    }).then(({data}) => {
      onCandidateAdded({
        id: data.id,
        name: data.name,
        presentation: data.presentation,
        symbolic: data.symbolic
      })
    })
  }, [name, presentation])

  const candidateElements = candidates.filter(
    (candidate) => !candidate.symbolic
  ).map((candidate) => (
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
          {candidateElements}
          <tr className={classes.adding}>
            <td><Button compact fullWidth onClick={addCandidate}>
              <Plus />
            </Button></td>
            <td>
              <TextInput onChange={(element) => setName(element.target.value)} />
            </td>
            <td>
              <TextInput onChange={(element) => setPresentation(element.target.value)} />
            </td>
          </tr>
        </tbody>
      </Table>
    </ScrollArea>
  </>
}





export default EditElection