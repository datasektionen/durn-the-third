import React, { useCallback, useState } from "react"
import { v4 as uuidv4 } from "uuid"
import axios from "axios"
import { Header } from "methone"

import { Container, Grid, TextInput, Text, Button, NumberInput, Box, createStyles } from "@mantine/core"
import { useForm } from "@mantine/form"
import { useListState } from "@mantine/hooks"

import { Candidate, NullTime } from "../../util/ElectionTypes"
import { DateTimeInput } from "../../components/DateTime";
import { CandidateList } from "../../components/CandidateList"
import useAuthorization from "../../hooks/useAuthorization"

// import DateTimePicker from "react-datetime-picker"
// import DateTimeInput from "react-admin";

const useStyles = createStyles((theme) => {
  return {
    failed: {
      backgroundColor: "#e29493"
    }
  }
})

export const CreateElection: React.FC = () => {
  const { authHeader } = useAuthorization();
  const [failed, setFailed] = useState(false);
  const { classes } = useStyles();

  const form = useForm({
    initialValues: {
      title: "",
      mandates: 1,
      extraMandates: 0,
      openTime: null as NullTime,
      closeTime: null as NullTime,
    }
  });
  const changeOpenTime = (value: NullTime) => {
    form.setFieldValue("openTime", value)
  }
  const changeCloseTime = (value: NullTime) => {
    form.setFieldValue("closeTime", value)
  }

  const [candidates, candidatesHandler] = useListState<Candidate>();
  const [removedCandidates, removedCandidatesHandler] = useListState<string>();
  const addCandidate = (candidate: Candidate) => {
    candidatesHandler.append({
      ...candidate,
      id: `tmp_${uuidv4()}`, 
      // changed: true,
    });
  };

  const removeCandidate = (candidate: Candidate) => {
    console.log(candidate)
    removedCandidatesHandler.append(candidate.id);
  };

  const candidateChanged = (candidate: Candidate) => {
    candidatesHandler.applyWhere(
      (item) => item.id == candidate.id,
      () => ({
        ...candidate,
        changed: false,
      }),
    )
  };

  const onSubmit = useCallback(form.onSubmit((values) => {
    if (values.title == "") {
      setFailed(true);
      return;
    }

    axios.post("/api/election/create", {
      name: values.title,
      mandates: values.mandates,
      extraMandates: values.extraMandates,
      openTime: values.openTime,
      closeTime: values.closeTime,
    }, {
      headers: authHeader
    }).then(({data}) => {
      candidates.forEach((candidate) => {
        axios.post(`/api/election/${data}/candidate/add`, {
          name: candidate.name,
          presentation: candidate.presentation,
        }, { headers: authHeader });
      })
    })
  }), [form, candidates, candidateChanged, removedCandidates]);

  

  return <>
    <Header title = "Create New Election"/>

    <Container my="md">
      <Box sx={(theme) => ({
        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[2],
        padding: "1rem",
        borderRadius: "5pt"
      })}>

        <form onSubmit={onSubmit}>

          <Grid align="cent">
            <Grid.Col md={12}>
              <Button type="submit" fullWidth>
                <div style={{marginTop: "1rem", marginBottom: "1rem"}}>
                  <Text fw={700} size="xl" >
                    Create
                  </Text>
                </div> 
              </Button>
            </Grid.Col>

            <Grid.Col md={3}>
              <div style={{ marginBottom: "3rem" }} >
                <Text align="center" size="lg" color="dimmed" fw={700}>
                  Election starts
                </Text>
                <DateTimeInput
                  onChange={changeOpenTime}
                  defaultDate={null}
                />
              </div>

              <div style={{ marginBottom: "2rem" }} >
                <Text align="center" size="lg" color="dimmed" fw={700}>
                  Election ends
                </Text>
                <DateTimeInput
                  onChange={changeCloseTime}
                  defaultDate={null}
                />
              </div>

              <div style={{ marginBottom: "2rem" }} >
                <Text align="center" size="lg" color="dimmed" fw={700}>
                  Mandates
                </Text>
                <NumberInput 
                  {...form.getInputProps("mandates")} 
                  min={0}
                />
              </div>

              <div style={{ marginBottom: "2rem" }} >
                <Text align="center" size="lg" color="dimmed" fw={700}>
                  Secondary mandates
                </Text>
                <NumberInput 
                  {...form.getInputProps("extraMandates")} 
                  min={0}
                />

              </div>
            </Grid.Col>


            <Grid.Col md={9}>

              <TextInput 
                // class={failed ? classes.failed : "2"}
                placeholder="Election title"
                size="xl"
                {...form.getInputProps("title")}
              />
              <br/>
              <CandidateList 
                candidates={
                  candidates.filter(v => !removedCandidates.includes(v.id))
                }
                onCandidateAdded={addCandidate}
                onCandidateChanged={candidateChanged}
                onCandidateRemoved={removeCandidate}
              />
            </Grid.Col>
            <Grid.Col>

            </Grid.Col>
          </Grid>
        </form>
      </Box>
    </Container>
  </>
}