import React, { useCallback, useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import { Header } from "methone"
import axios from "axios";

import { Grid, Container, TextInput, Button, Text, Textarea, ScrollArea, Table, createStyles, Modal, Center, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { Plus, X } from "tabler-icons-react";

import { Election, createEmptyElection, NullTime, parseElectionResponse, Candidate } from "../../util/ElectionTypes";
import useAuthorization from "../../hooks/useAuthorization";
import { DateTimeInput } from "../../components/DateTime";
import { ErrorModal, InformationModal } from "../../components/PopupModals";
import useMap from "../../hooks/useMap";

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
  const { adminRead, loggedIn, authHeader } = useAuthorization()
  const [election, setElection] = useState<Election>(createEmptyElection())
  const [error, setError] = useState<string | null>(null)
  const [updateSuccess, setSuccess] = useState(false)
  const [openFinalize, setOpenFinalize] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const { classes, cx } = useStyles()
  const [changedCandidates, changedCandidatesActions] = useMap<string, Candidate>()
  const navigate = useNavigate()

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

  const makeEditingRequest = useCallback((method: string, url: string, data: any) => {
    axios({
      method: method,
      url: url,
      data: data,
      headers: authHeader
    }).then(({ data }) => {
      setElection(parseElectionResponse(data))
      setSuccess(true)
    }).catch(({reason}) => {
      setError(`Failed to submit election changes to server. Reason given: "${reason.data}"`)
    })
  }, [authHeader])

  const submitChanges = useCallback(form.onSubmit((values) => {
    makeEditingRequest("patch", `/api/election/${electionId}/edit`, values)
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

  const onCandidateRemoved = (candidate: Candidate, error: string | null) => {
    if (error) {
      setError(`Failed to remove candidate "${candidate.name}", sever gave reason: "${error}".`)
    } else {
      setElection({
        ...election,
        candidates: election.candidates.filter((c) => c.id != candidate.id)
      })
    }
  }

  const onCandidateAdded = (candidate: Candidate, error: string | null) => {
    if (error) {
      setError(`Failed to add candidate "${candidate.name}", sever gave reason: "${error}".`)
    } else {
      setElection((election): Election => {
        return {
          ...election,
          candidates: election.candidates.concat([candidate])
        }
      })
    }
  }

  const finalizeElection = () => {
    setOpenFinalize(false)
    makeEditingRequest("put", `/api/election/${electionId}/finalize`, {})
  }

  const publishElection = () => {
    makeEditingRequest("put", `/api/election/${electionId}/publish`, {})
  }

  const unpublishElection = () => {
    makeEditingRequest("put", `/api/election/${electionId}/unpublish`, {})
  }

  const deleteElection = () => {
    setOpenDelete(false)
    axios.post(`/api/election/${electionId}/delete`, {}, {
      headers: authHeader
    }).then(() => {
      navigate("/admin")
    }).catch(({ reason }) => {
      setError(`Misslyckades med att radera valet. Servern svarade: "${reason.data}"`)
    })
  }

  useEffect(() => {
    if (!loggedIn) return;
    axios(`/api/election/${electionId}`, {
      headers: authHeader
    }).then(({ data }) => {
      setElection(parseElectionResponse(data))
    }).catch(()=>{})
  }, [loggedIn, authHeader])
  
  useEffect(() => {
    form.setValues({
      name: election.name,
      description: election.description,
      openTime: election.openTime,
      closeTime: election.closeTime
    })
  }, [election])

  if (!adminRead) navigate("/", { replace: true })
  
  return <> {adminRead && <>
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
        <Stack>
          <Text align="center">
            Vill du finalisera valet? Det går inte att ångra att finalisera ett val.
          </Text>
          <Button onClick={finalizeElection}>
            Finalisera
          </Button>
        </Stack>
      </Center>
    </Modal>

    <Modal centered opened={openDelete} title="Radera val"
      onClose={() => setOpenDelete(false)}
    >
      <Center>
        <Stack>
          <Text align="center">
            Vill du radera valet? Det går inte att ångra.
          </Text>
          <Button onClick={deleteElection} color={"red"}>
            Radera val
          </Button>
        </Stack>
      </Center>
    </Modal>

    <form onSubmit={submitChanges}>
      <Container my="md">
        <Grid align="center">
          <Grid.Col span={1}>
            <Text align="right" fz="lg" fw={700}>Titel: </Text>
          </Grid.Col>
          <Grid.Col span={9}>
            <TextInput size="lg" {...form.getInputProps("name")} placeholder="titlel"/>
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


            <div style={{ marginTop: "5rem" }}>
              <Button fullWidth onClick={() => setOpenDelete(true)} color={"red"}>
                Radera val
              </Button>
            </div>
            
          </Grid.Col>

          <Grid.Col span={9}>
            <Textarea {...form.getInputProps("description")} placeholder="beskrivning"/>
            <div style={{marginTop: "1rem"}}>
              <CandidateList
                candidates={election.candidates}
                electionId={electionId}
                onCandidateChanged={onCandidateChanged}
                onCandidateRemoved={onCandidateRemoved}
                onCandidateAdded={onCandidateAdded}
              />
            </div>
          </Grid.Col>
        </Grid>
      </Container>
    </form>
  </>} </>
}

interface CandidateListProps {
  candidates: Candidate[]
  electionId: string
  onCandidateAdded: (candidate: Candidate, error: string | null) => void
  onCandidateChanged: (candidate: Candidate) => void
  onCandidateRemoved: (candidate: Candidate, error: string | null) => void
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
      }, null)
      setName("")
      setPresentation("")
    }).catch(({response}) => {
      onCandidateAdded({
        id: "",
        name: name,
        presentation: presentation,
        symbolic: false
      }, response.data)
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
  onCandidateRemoved: (candidate: Candidate, error: string | null) => void
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
      onCandidateRemoved(candidate, null)
    }).catch(({response}) => {
      onCandidateRemoved(candidate, `${response.data}`)
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