import React, { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { Header } from "methone";

import { Container, createStyles, Center, Button, Modal, Text, Grid } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure, useListState } from "@mantine/hooks";

import { Candidate, CandidateSchema, Election, ElectionSchema, NullTime, parseElectionResponse } from "../../util/ElectionTypes";
import useAuthorization from "../../hooks/useAuthorization";
import { useNavigate, useParams } from "react-router-dom";
import { useAPIData } from "../../hooks/useAxios";
import { AdminElectionView, ElectionFormValues } from "../../components/AdminElectionView";
import Loading, { Error } from "../../components/Loading";
import { ClassNames } from "@emotion/react";
import { DisplaySchultzeResult } from "../../components/DisplayResult";
import { string, z } from "zod";

const useStyles = createStyles((theme) => ({
  failed: {
    backgroundColor: "#e29493"
  },
  button: {
    marginTop: "2rem"
  }
}));

const EditElection: React.FC = () => {
  const { authHeader } = useAuthorization();
  const navigate = useNavigate();
  const [userInputError, setError] = useState<string | false>(false);
  const [loading, setLoading] = useState(true);
  const electionId = useParams()["id"] ?? "";
  const [electionData, loadingData, fetchError] = useAPIData<Election>(
    `/api/election/${electionId}`,
    (data) => ElectionSchema.parseAsync(parseElectionResponse(data)),
  );
  const [candidates, candidatesHandler] = useListState<Candidate>();
  const electionForm = useForm<ElectionFormValues>({
    initialValues: {
      title: "",
      mandates: 1,
      extraMandates: 0,
      openTime: null as NullTime,
      closeTime: null as NullTime,
    }
  });

  const [finalizeModalOpen, {
    open: openFinalizeModal, 
    close: closeFinalizeModal
  }] = useDisclosure(false);

  const [countingModalOpen, {
    open: openCountingModal,
    close: closeCountingModal
  }] = useDisclosure(false);
  
  const [deleteModalOpen, {
    open: openDeleteModal,
    close: closeDeleteModal
  }] = useDisclosure(false);
  const [electionResult, electionResultHandler] = useListState<Candidate>([]);

  const { classes } = useStyles();

  useEffect(()=> {
    if (!loadingData && !fetchError && electionData) {
      electionForm.setValues({
        title: electionData.name,
        mandates: electionData.mandates,
        extraMandates: electionData.extraMandates,
        openTime: electionData.openTime,
        closeTime: electionData.closeTime,
      });
      candidatesHandler.setState(
        electionData.candidates.filter((c: Candidate) => !c.symbolic)
          .map((c: Candidate) => ({
            ...c,
            changed: false,
          }))
      );
      setLoading(loadingData);
    }
  }, [electionData, loadingData, fetchError]);

  const changeOpenTime = (value: NullTime) => {
    electionForm.setFieldValue("openTime", value)
  }
  const changeCloseTime = (value: NullTime) => {
    electionForm.setFieldValue("closeTime", value)
  }

  const addCandidate = (candidate: Candidate) => {
    candidatesHandler.append({
      ...candidate,
      id: `tmp_${uuidv4()}`,
      changed: true,
      added: true,
    });
  };

  const removeCandidate = (candidate: Candidate) => {
    // removedCandidatesHandler.append(candidate.id);
    candidatesHandler.applyWhere(
      (c) => c.id == candidate.id,
      (c) => ({
        ...c,
        removed: true,
      })
    )
  };

  const changeCandidate = (candidate: Candidate) => {
    candidatesHandler.applyWhere(
      (item) => item.id == candidate.id && (
        item.name != candidate.name ||
        item.presentation != candidate.presentation
      ),
      () => ({
        ...candidate,
        changed: true,
      }),
    )
  };

  const saveElection = useCallback((values: typeof electionForm.values) => {
    axios.patch(`/api/election/${electionId}/edit`, {
      name: values.title,
      mandates: values.mandates,
      extraMandates: values.extraMandates,
      openTime: values.openTime,
      closeTime: values.closeTime,
    }, {
      headers: authHeader
    }).then(() => Promise.all(
      // submit all changes made to candidates
      candidates.filter(
        (c) => !c.added && !c.removed && c.changed
      ).map((candidate) =>
        axios.put( `/api/election/candidate/${candidate.id}/edit`, {
          name: candidate.name,
          presentation: candidate.presentation,
        }, { headers: authHeader })
    ))).then(() => Promise.all(
      // submit all removals of candidates
      candidates.filter(
        (c) => !c.added && c.removed
      ).map((candidate) =>
        axios.post( `/api/election/candidate/${candidate.id}/delete`, {},
          { headers: authHeader }
        ).then(() => {
          candidatesHandler.filter(
            (c) => c.id != candidate.id
          );
        })
    ))).then(() => Promise.all(
      // submit all added candidates
      candidates.filter(
        (c) => c.added && !c.removed
      ).map((candidate) =>
        axios.post(`/api/election/${electionId}/candidate/add`, {
          name: candidate.name,
          presentation: candidate.presentation,
        }, { headers: authHeader })
    ))).then(() => {
      // reset state
      candidatesHandler.filter((c) => !(c.removed && c.added));
      candidatesHandler.apply((c) => ({
        ...c,
        changed: false,
        added: false,
      }));
      window.location.reload();

    }).catch(() => { })
  }, [candidates, changeCandidate, electionId])

  const submitElectionForm = useCallback(electionForm.onSubmit((values) => {
    if (values.title == "") {
      setError("Title can't be empty");
    } else if (values.closeTime && !values.openTime) {
      setError("The end of the election can't be set without setting the start");
    } else if (
      values.openTime && values.closeTime &&
      values.closeTime <= values.openTime
    ) {
      setError("The end of the election can't be before the start");
    } else {
      saveElection(values);
    }
  }), [setError, electionForm]);

  const finaliseElectionAndCountVotes = useCallback(() => {
    axios.put(`/api/election/${electionId}/finalize`, {}, {
      headers: authHeader
    }).then(() => {
      countVotes();
    }).catch(() => {
      setError("failed to finalize election");
    });
    closeFinalizeModal();
    // write.PUT("/election/:id/finalize", actions.FinalizeElection)
  }, [authHeader, electionId]);

  const countVotes = useCallback(() => {
    axios.get(`/api/election/${electionId}/count`, {
      headers: authHeader,
    }).then(({ data }) => {
      z.array(CandidateSchema).parseAsync(data).then(ranking => {
        electionResultHandler.setState(ranking);
        openCountingModal();
      }).catch(() => {
        setError("Counting endpoint returned invalid data");
      });

    }).catch((error) => {
      setError("Failed to count votes: " + error);
    });
  }, [authHeader, electionId])

  const deleteElection = useCallback(() => {
    axios.post(`/api/election/${electionId}/delete`, {}, {
      headers: authHeader,
    }).then(() => {
      navigate("/admin");
    }).catch((error) => {
      setError("Failed to delete election: " + error);
      closeDeleteModal();
    });
  }, [authHeader, electionId])

  return <>
    <Header title="Editing Election" />
    <Container my="md">
      {loading && <Center> <Loading/> </Center>}
      {!loading && fetchError && 
        <Center> <Error error={fetchError} /> </Center>}
      {!loading && userInputError && 
        <Center> <Error error={userInputError} /> </Center>}
      {!loading && !fetchError && electionData && <>
        <AdminElectionView 
          candidates={
            candidates.filter(c => !c.removed)
          }
          onCandidateAdded={addCandidate}
          onCandidateChanged={changeCandidate}
          onCandidateRemoved={removeCandidate}
          electionForm={electionForm}
          onOpenTimeChanged={changeOpenTime}
          onCloseTimeChanged={changeCloseTime}
          onSubmit={submitElectionForm}
          submitText="Save Changes"
          userInputError={userInputError}
          openTimeDefault={electionData.openTime}
          closeTimeDefault={electionData.closeTime}
        />

        <Modal opened={finalizeModalOpen} onClose={closeFinalizeModal} centered my={"md"}
          title={ <Text fw={700}>Finalize election</Text> }
        >
          <Text> 
            Are you sure that you want to finalize the election? It's not possible to undo the finalization. 
            <br /><br />
            The election has to be finalized in order to count the Votes. 
            <br /><br />
            It is not possible to vote or edit the election once it is finalized.
          </Text>

          <Button
            fullWidth className={classes.button}
            onClick={finaliseElectionAndCountVotes}
          >
            <Text fw={700} size="xl" >
              Finalize and count votes
            </Text>
          </Button>
        </Modal>

        <Modal opened={countingModalOpen} onClose={closeCountingModal} centered my={"xl"}>
          <DisplaySchultzeResult 
            election={electionData}
            ranking={electionResult}
          />
        </Modal>


        <Grid gutter={26}>
          <Grid.Col span={12}>
            {!electionData.finalized &&
              <Button 
                fullWidth  className={classes.button} 
                onClick={openFinalizeModal}
              >
                <Text fw={700} size="xl">
                  Finalize and count votes
                </Text>
              </Button>
            }
            {electionData.finalized &&
              <Button
                fullWidth className={classes.button}
                onClick={countVotes}
              >
                <Text fw={700} size="xl" >
                  Count votes
                </Text>
              </Button>
            }
          </Grid.Col>
          <Grid.Col span={12}>
            <Button color="red" fullWidth onClick={openDeleteModal}>
              <Text fw={700} size="xl">
                Delete Election
              </Text>
            </Button>
          </Grid.Col>

        </Grid>
        
        <Modal opened={deleteModalOpen} onClose={closeDeleteModal} centered
          title={ <Text fw={700}>Delete election</Text> }
        >
          <Text>
            Are you sure that you want to delete the election? It can't be undone.
          </Text>

          <Button
            fullWidth className={classes.button}
            onClick={deleteElection}
            color="red"
          >
            <Text fw={700} size="xl" >
              Delete election
            </Text>
          </Button>
        </Modal>

      </>}
    </Container>
  </>
}

export default EditElection;