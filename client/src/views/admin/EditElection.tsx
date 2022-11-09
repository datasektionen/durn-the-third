import React, { useCallback, useEffect, useState } from "react";
import {
  useParams,
} from "react-router-dom";
import { Header } from "methone"
import axios from "axios";

import { Grid, Container, TextInput, Button, Text, Textarea, ScrollArea, Table, createStyles, Modal, Center } from "@mantine/core";
import { useForm } from "@mantine/form";

import { Election, createEmptyElection, NullTime, parseElectionResponse, Candidate } from "../../util/ElectionTypes";
import useAuthorization from "../../hooks/useAuthorization";
import { DateTimeInput } from "../../components/DateTime";
import { Plus, X } from "tabler-icons-react";
import { ErrorModal, InformationModal } from "../../components/Information";
import useMap from "../../util/useMap";

const useStyles = createStyles((theme) => { return {
  changed: {
    backgroundColor: "#d3f8d3"
  },
  adding: {
    backgroundColor: theme.colors.gray[1]
  }
}})

const EditElection: React.FC = () => {
  const electionId = useParams()["id"] ?? ""
  const { authHeader } = useAuthorization()
  const [election, setElection] = useState<Election>(createEmptyElection())
  const [error, setError] = useState<string | null>(null)
  const [updateSuccess, setSuccess] = useState(false)
  const [openFinalize, setOpenFinalize] = useState(false)
  const { classes, cx } = useStyles()
  const [changedCandidates, changedCandidatesActions] = useMap<string, Candidate>()

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
      setError("Failed to submit election changes to server")
    })
  }

  const submitChanges = useCallback(form.onSubmit((values) => {
    makeRequest("patch", `/api/election/${electionId}/edit`, values)
    election.candidates.
      filter((candidate) => changedCandidates.has(candidate.id)).
      forEach((candidate) => {
        axios.put(`/api/election/candidate/${candidate.id}/edit`, {
          name: candidate.name,
          presentation: candidate.presentation
        }, { headers: authHeader}).catch(() => {
          changedCandidatesActions.remove(candidate.id)
        })
      })

    setElection({
      ...election,
      candidates: election.candidates.map((candidate): Candidate => {
        return {
          ...candidate,
          ...(changedCandidates.get(candidate.id) ?? {})
        }
      })
    })
    changedCandidatesActions.reset()
  }), [form, changedCandidates])

  const onCandidateChanged = (candidate: Candidate) => {
    changedCandidatesActions.set(candidate.id, candidate)
  }

  const onCandidateRemoved = (candidate: Candidate, success: boolean) => {
    if (!success) {
      setError(`Failed to remove candidate "${candidate.name}"`)
    } else {
      setElection({
        ...election,
        candidates: election.candidates.filter((c) => c.id != candidate.id)
      })
    }
  }

  const finalizeElection = () => {
    setOpenFinalize(false)
    makeRequest("put", `/api/election/${electionId}/finalize`, {})
  }

  const publishElection = () => {
    makeRequest("put", `/api/election/${electionId}/publish`, {})
  }

  const unpublishElection = () => {
    makeRequest("put", `/api/election/${electionId}/unpublish`, {})
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

    <ErrorModal error={error ?? ""}
      opened={error != null} onClose={() => {setError(null)}}
    />

    <InformationModal info="Election updated"
      opened={updateSuccess} onClose={() => {setSuccess(false)}}
    />

    <Modal centered opened={openFinalize} title="Finalisera val"
      onClose={() => setOpenFinalize(false)}
    >
      <Center>
        <Text align="center">
          Vill du finalisera valet? Det går inte att ångra att finalisera ett val.
        </Text>
        <Button onClick={finalizeElection}>
          Finalisera
        </Button>
      </Center>
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
              {election.published ? 
                <Button onClick={unpublishElection} fullWidth>
                  Avpublicera
                </Button>
                :
                <Button onClick={publishElection} fullWidth>
                  Publicera
                </Button>
              }
            </div>

            <div style={{ marginTop: "2rem" }}>
              <Button fullWidth disabled={election.finalized} onClick={() => setOpenFinalize(true)}>
                {election.finalized ? "Finaliserat" : "Finalisera"}
              </Button>
            </div>

            
          </Grid.Col>

          <Grid.Col span={9}>
            <Textarea {...form.getInputProps("description")} />
            <div style={{marginTop: "1rem"}}>
              <CandidateList
                candidates={election.candidates}
                electionId={electionId}
                onCandidateChanged={onCandidateChanged}
                onCandidateRemoved={onCandidateRemoved}
                onCandidateAdded={(candidate) => setElection((election): Election => {
                  return {
                    ...election,
                    candidates: election.candidates.concat([candidate])
                  }
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
  onCandidateChanged: (candidate: Candidate) => void
  onCandidateRemoved: (candidate: Candidate, success: boolean) => void
}

const CandidateList: React.FC<CandidateListProps> = (
  { candidates, electionId, onCandidateAdded, onCandidateChanged, onCandidateRemoved }
) => {
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
      setName("")
      setPresentation("")
    })
  }, [name, presentation])

  const candidateElements = candidates.filter(
    (candidate) => !candidate.symbolic
  ).map((candidate) => (
    <CandidateRow candidate={candidate} onCandidateChanged={onCandidateChanged} onCandidateRemoved={onCandidateRemoved}/>
  ))

  return <>
    <ScrollArea>
      <Table withBorder withColumnBorders striped>
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
              <TextInput value={name}
                onChange={(element) => setName(element.target.value)}
              />
            </td>
            <td>
              <TextInput value={presentation}
                onChange={(element) => setPresentation(element.target.value)}
              />
            </td>
          </tr>
        </tbody>
      </Table>
    </ScrollArea>
  </>
}

interface CandidateRowProps {
  candidate: Candidate,
  onCandidateChanged: (candidate: Candidate) => void
  onCandidateRemoved: (candidate: Candidate, success: boolean) => void
}

const CandidateRow: React.FC<CandidateRowProps> = (
  { candidate, onCandidateChanged, onCandidateRemoved }
) => {
  const [name, setName] = useState(candidate.name)
  const [presentation, setPresentation] = useState(candidate.presentation)
  const { authHeader } = useAuthorization()

  const removeCandidate = () => {
    axios.post(`/api/election/candidate/${candidate.id}/delete`, {}, {
      headers: authHeader
    }).then(() => {
      onCandidateRemoved(candidate, true)
    }).catch(() => {
      onCandidateRemoved(candidate, false)
    })
  }

  useEffect(() => {
    onCandidateChanged({
      ...candidate,
      name: name,
      presentation: presentation,
    })
  }, [name, presentation])

  return <>
    <tr>
      <td>
        <Button color={"red"} compact fullWidth onClick={removeCandidate}>
          <X/>
        </Button>
      </td>
      <td>
        <TextInput
          value={name}
          onChange={(element) => setName(element.target.value)}
        />
      </td>
      <td>
        <TextInput
          value={presentation}
          onChange={(element) => setPresentation(element.target.value)}
        />
      </td>
    </tr>
  </>
}





export default EditElection