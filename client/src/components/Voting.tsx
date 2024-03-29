import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

import { DragDropContext, Droppable, Draggable, DropResult, DragUpdate } from 'react-beautiful-dnd'
import { Selector, Tex } from 'tabler-icons-react'
import { useForm } from "@mantine/form"
import { useDisclosure, useListState } from "@mantine/hooks";
import { Button, Center, createStyles, Grid, TextInput, Text, Modal } from "@mantine/core";

import { Candidate, Election } from "../util/ElectionTypes";
import useAuthorization from "../hooks/useAuthorization";
import constants from "../util/constants";
import { compareList } from "../util/funcs";
import Loading, { Error } from "./Loading";
import dayjs from "dayjs";
import { useAPIData } from "../hooks/useAxios";
import { z } from "zod";
import { redirect } from "react-router-dom";

interface candidateInfo {
  id: string,
  name: string,
  presentation: string, 
  symbolic: boolean
}

const useStyles = createStyles((theme) => ({
  item: {
    display: 'flex',
    alignItems: 'center',
    borderRadius: theme.radius.md,
    border: `1px solid ${theme.colors.gray[4] }`,
    padding: `${theme.spacing.sm}px ${theme.spacing.xl}px`,
    backgroundColor: theme.white,
    marginBottom: theme.spacing.sm,
  },

  droppable: {
  },

  dragHandle: {
    ...theme.fn.focusStyles(),
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    padding: "1rem",
    paddingTop: "2rem",
    margin: "-1rem",
    marginLeft: "-2rem",
    marginTop: "-2rem"
  },

  disabled: {
    backgroundColor: theme.colors.gray[3],
  },

  itemDragging: {
    boxShadow: theme.shadows.sm,
  },

  symbol: {
    fontSize: 30,
    fontWeight: 700,
    width: 60,
  },

  flexRow: { 
    display: "flex", 
    justifyContent: "space-between", 
    width: "100%", 
    alignItems: "center", 
    gap: "1rem"
  },

  flexSubRow: {
    display: "flex",
    justifyContent: "left",
    alignItems: "center",
    gap: "1rem"
  },

  box: {
    boxShadow: "1px 1px 1px 1px rgba(0,0,0,0.15)",
    border: `1px solid ${theme.colors.gray[5]}`,
    width: "3.2rem",
    textAlign: "center",
    borderRadius: "0.5rem",
    paddingLeft: "1rem",
    paddingRight: "1rem",
    paddingTop: "0.4rem",
    paddingBottom: "0.4rem",
    userSelect: "none",
    whiteSpace: "nowrap",
  },

  boxtext: {
    textAlign: "center",
    marginLeft: "-50%",
    marginRight: "-50%"
  },

  info : {
    padding: "1rem",
    marginBottom: "1rem",
    borderRadius: "0.5rem",
    backgroundColor: "rgb(197, 202, 233)",
  },

  votingDisabledInfo: {
    margin: "2rem",
    padding: "0.5rem",
    paddingTop: "1rem",
    textAlign: "center",
    borderRadius: "0.6rem",
    backgroundColor: "#ffcccb"
  },

  candidate: {
    margin: "1rem",
    padding: "0.5rem",
    paddingTop: "0.7rem",
    backgroundColor: theme.colors.gray[1],
    borderRadius: "0.5rem",
    boxShadow: "1px 1px 1px 1px rgba(0,0,0,0.15)",
  },

  hasVotedInfo: {
    padding: "1rem",
    paddingBottom: "0.5rem",
    marginBottom: "1rem",
    borderRadius: "0.5rem",
    backgroundColor: "rgb(255, 250, 160)",
  }
}));

const InfoBox: React.FC = () => {
  const { classes, cx } = useStyles()

  return <div className={cx(constants.themeColor, "lighten-4", classes.info)}>
    <p>
      Rank the the candidates in your preferred order. <br/> <br/>
      Note that the ordering of the candidates that are ranked below <i>Vakant</i> is taken into account. <br/><br/>
      You will be able to change your vote once it is submitted
    </p>
  </div>
}

export interface VotingProps {
  election: Election
}

export const Voting: React.FC<VotingProps> = ({
  election
}) => {
  const keys = new Map (election.candidates.map((candidate)=>
    [candidate.id, [(candidate.symbolic ? 1 : 0), Math.random()]]
  ));
  const [voteOrder, voteOrderHandlers] = useListState<candidateInfo>(election.candidates.map(
    (candidate) => {return {
      id: candidate.id,
      name: candidate.name,
      presentation: candidate.presentation,
      symbolic: candidate.symbolic
    }}
  ).sort((a: candidateInfo, b: candidateInfo) => {
    const aKey = keys.get(a.id) ?? [1, 1]
    const bKey = keys.get(b.id) ?? [1, 1]
    return compareList(aKey, bKey)
  }));

  const { classes, cx } = useStyles();
  const [displayIndex, setDisplayIndex] = useState<Map<string, string>>(new Map<string, string>());
  // const [hasVoted, setHasVoted] = useState(false)
  const [hasVoted, loadingHasVoted, errorHasVoted] = useAPIData(
    `/api/election/${election.id}/has-voted`,
    (data) => z.boolean().parseAsync(data)
  );
  const [mayVote, setMayVote] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { authHeader } = useAuthorization();
  const [unathorized, setUnathorized] = useState(false);
  const [submittedVoteOrder, setSubmittedVoteOrder] = useState<Candidate[]>([]);
  const [submitVoteLoading, setSubmitVoteLoading] = useState<boolean>(false);

  const [voteModalOpen, {
    open: openVoteModal,
    close: closeVoteModal
  }] = useDisclosure(false);
  
  const [successfulModalOpen, {
    open: openSuccessfulModal,
    close: closeSuccessfulModal
  }] = useDisclosure(false);

  const hasOpened = useMemo(() => (
    (election.openTime ? dayjs(Date.now()).isAfter(election.openTime) : false)
  ), [election.openTime]);

  const hasClosed = useMemo(() => (
    (election.closeTime ? dayjs(Date.now()).isAfter(election.closeTime) : true)
  ), [election.closeTime]);

  const disabled = useMemo(() => (
    election.finalized || !hasOpened || hasClosed || !mayVote || loadingHasVoted || submitVoteLoading
  ), [hasVoted, hasOpened, hasClosed, mayVote, loadingHasVoted, submitVoteLoading]);

  const updateDisplayIndex = useCallback((indexes: Map<string, number>) => {
    let firstSymbolic = voteOrder.length;

    // voteOrder.forEach((candidate) => {
    //   if (candidate.symbolic) firstSymbolic = Math.min(firstSymbolic, indexes.get(candidate.id) ?? firstSymbolic)
    // })

    setDisplayIndex(new Map(voteOrder.map((candidate) => {
      let index = indexes.get(candidate.id) ?? 0
      return [candidate.id, `${firstSymbolic < index ? "-" : index + 1}`]
    })));
  }, [setDisplayIndex, voteOrder]);

  const handleItemUpdate = useCallback(({ destination, source }: DragUpdate) => {
    if (destination == undefined) return;
    const adjustedIndexes = new Map(voteOrder.map((candidate, index) => {
      if (source.index == destination.index) 
        return [candidate.id, index]
      if (index == source.index) 
        return [candidate.id, destination.index]
      return [candidate.id, (source.index < destination.index ?
        index - (index > source.index ? 1 : 0) + (index > destination.index ? 1 : 0) :
        index + (index >= destination.index ? 1 : 0) - (index >= source.index ? 1 : 0)
      )]
    }));
    updateDisplayIndex(adjustedIndexes);
  }, [voteOrder]);
  
  const handleItemDrop = useCallback(({ destination, source }: DropResult) => {
    if (!destination) return;
    voteOrderHandlers.reorder({
      from: source.index,
      to: destination.index,
    });
  }, [voteOrderHandlers]);

  const submitVote = useCallback(() => {
    setSubmittedVoteOrder(voteOrder);
    setSubmitVoteLoading(true);

    axios.post(`/api/election/${election.id}/vote`, {
      secret: "",
      ranking: voteOrder.map((c) => c.id)
    }, {
      headers: authHeader
    }).then(({ data }) => {
      openSuccessfulModal();
      setSubmitVoteLoading(false);
    }).catch(( {response} ) => {
      console.log(response);
      if (response.status == 401) {
        setUnathorized(true);
      }
      setError(response.data);
      setSubmitVoteLoading(false);
    });

    // closeVoteModal();

  }, [voteOrder, authHeader])

  useEffect(() => {
    axios(`/api/voter/allowed`, {
      headers: authHeader
    }).then(() => {
      setMayVote(true);
    }).catch(({response}) => {
      if (response.status == 403) 
        setMayVote(false);
    })
  }, [authHeader])

  useEffect(
    () => updateDisplayIndex(new Map(voteOrder.map((candidate, index) => [candidate.id, index]))),
    [voteOrder]
  )

  const items = voteOrder.map((candidate, index) => (
    <DraggableCandidate candidate={candidate} index={index} disabled={disabled} displayIndex={displayIndex}/>
  ))

  return <>
    <div>
      <p>{election.description}</p>
    </div>

    {election.openTime && election.closeTime &&
      <Grid my="md">
        <Grid.Col md={4}>
          <p>
            <b>Election opened</b> <br/>
            {election.openTime.toLocaleString()}
          </p>
        </Grid.Col>
        <Grid.Col md={4}>
          <p>
            <b>Election ends</b> <br/>
            {election.closeTime.toLocaleString()}
          </p>
        </Grid.Col>
        <Grid.Col md={4}>
          <p >
            <b>{election.mandates}</b> mandates to be elected<br />
            {election.extraMandates > 0 && <>
              <b>{election.extraMandates}</b> secondary mandates to be elected </>}
          </p>
        </Grid.Col>
      </Grid>
    }

    <InfoBox />

    {disabled && !loadingHasVoted && !submitVoteLoading &&
      <div className={classes.votingDisabledInfo}>
        
        {(election.finalized || (hasClosed && hasOpened)) &&
          <p> It is no longer possible to vote in this election. </p>
        }

        {!mayVote && !hasVoted &&
          <p>
            You don't have the right to vote in this election<br/>
            Contact the Election Committee if you are a member that should have this right.<br/>
            (<a href="mailto:valberedningen@datasektionen.se">valberedningen@datasektionen.se</a>) 
            
          </p>
        }

        {!election.finalized &&  !hasOpened && mayVote &&
          <p>This election hasn't been opened yet.</p>
        }

        {/* {!(election.finalized ||  hasClosed || !hasOpened) && hasVoted &&
          <p>You've already voted in this election.</p>
        } */}
      </div>
    }

    {!disabled && !loadingHasVoted && hasVoted && 
      <div className={classes.hasVotedInfo}>
        <p>
          You have voted in this election already, but it is possible to change your vote if needed! <br/>
          Note that the order of the candidates are randomized each time you load the page, and not necessarily the same as the order you previously voted in.
        </p>
      </div>
    }


    {unathorized && <>
      <Error error={"Your user session has expired, try relogging before voting"} />
      <br/>  
    </>}
    {error && !unathorized && <>
      <Error error={"Vote failed to be submitted, please contact IOR"} />
      <br/>
    </>}


    {/* <Modal opened={voteModalOpen} onClose={closeVoteModal} centered title="Submit vote">
      <Text>
        Are you sure you want to submit your vote? It can't be changed once submitted.
      </Text>
      <Button disabled={disabled} onClick={submitVote} fullWidth>
        Vote
      </Button>
    </Modal> */}
  
    <Modal opened={successfulModalOpen} onClose={() => window.location.assign("/")} centered title="Vote successfully submitted">
      <Text>
        Your vote has successfully been submitted! You voted in the following order: 
      </Text>
      <div className={cx(constants.themeColor, "lighten-4", classes.info)}>
        {submittedVoteOrder.map((candidate, i) => (
          <Text className={cx(classes.candidate)} fs={candidate.symbolic ? "italic" : ""}>
            {i+1}: {candidate.name}
          </Text>
        ))}
      </div>
      <Button onClick={() => window.location.assign("/")} fullWidth>
        Go back to homepage
      </Button>
    </Modal>
  
    {(loadingHasVoted || submitVoteLoading) && <Center style={{margin: "1rem"}}>
      <Loading />
    </Center>}

    <div className={classes.flexRow} style={{marginBottom:"1rem"}}>
      <Button disabled={disabled} onClick={submitVote} fullWidth>
        Vote
      </Button>
    </div>

    <DragDropContext onDragEnd={handleItemDrop} onDragUpdate={handleItemUpdate}>
      <Droppable droppableId="vote-ordering" direction="vertical">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef} className={classes.droppable}>
            {items}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>

  </>
}

interface DraggableCandidateProps {
  candidate: Candidate
  index: number
  disabled: boolean
  displayIndex: Map<string, string>
}

const DraggableCandidate: React.FC<DraggableCandidateProps> = ({
  candidate, index, disabled, displayIndex
}) => {
  const {classes, cx} = useStyles()
  return <>
    <Draggable key={candidate.id} index={index} draggableId={candidate.id} isDragDisabled={disabled}>
      {(provided, snapshot) => {
        // https://github.com/atlassian/react-beautiful-dnd/issues/958#issuecomment-980548919
        // disable x-axis movement 
        let transform = provided.draggableProps.style?.transform;
        if (snapshot.isDragging && transform) {
          transform = transform.replace(/\(.+\,/, "(0px,");
        }
        const style = {
          ...provided.draggableProps.style,
          transform,
        };

        return <div
          className={cx(
            classes.item, 
            { [classes.itemDragging]: snapshot.isDragging }, 
            { [classes.disabled]: disabled }
          )}
          {...provided.draggableProps}
          ref={provided.innerRef}
          style={style}
        >
          <div className={classes.flexRow}>
            <div className={classes.flexSubRow}>
              <div {...provided.dragHandleProps} className={classes.dragHandle}>
                <Selector size={18} strokeWidth={2} color={'black'} />
              </div>
              <div className={classes.box}> <span className={classes.boxtext}>
                {displayIndex.get(candidate.id) ?? '-'}
              </span> </div>
              <div> <Text fs={candidate.symbolic ? "italic" : ""} fw={candidate.symbolic ? 500 : 400}
                sx={{ fontFamily: 'Lato' }}>
                {candidate.name}
              </Text> </div>
            </div>
            {candidate.presentation != "" && !candidate.symbolic ?
              <div style={{ whiteSpace: "nowrap", marginLeft: "0.5rem" }}> <span>
                <a href={candidate.presentation} target="_blank"> Presentation </a>
              </span> </div> : <></>}
          </div>
        </div>
      }}
    </Draggable>
  </>
}