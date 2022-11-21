import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { Selector } from 'tabler-icons-react'
import { useForm } from "@mantine/form"
import { useListState } from "@mantine/hooks";
import { Button, Center, createStyles, Grid, TextInput, Text } from "@mantine/core";

import { Candidate, Election } from "../util/ElectionTypes";
import useAuthorization from "../hooks/useAuthorization";
import constants from "../util/constants";
import { compareList } from "../util/funcs";
import { ErrorModal, InformationModal } from "./PopupModals";
import { time } from "console";
import dayjs from "dayjs";

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
    top: "auto!important",
    left: "auto!important",
  },

  droppable: {
    overflowY: "scroll",
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
  }

}));

const InfoBox: React.FC = () => {
  const { classes, cx } = useStyles()

  return <div className={cx(constants.themeColor, "lighten-4", classes.info)}>
    <p>
      Rangordna kandidater i den ordningen som du föredrar dem. Om du lägger <strong>Blank</strong> eller <strong>Vakant</strong> ovanför en kandidat betyder det att du hellre vill rösta blankt 
      eller vakanssätta posten än att den kandidaten blir vald. Allt som ligger under Blank eller Vakant spelar ordningen ingen roll på, och allt under är därför makerat med "<strong>-</strong>" istället för en siffra.
      <br /><br />
      <strong>Secret</strong> ska innehålla en minst 10 karaktärer lång sträng, den behövs för att räkna ut en unik hash (eller id) för din röst och kommer kunna användas för att verifiera din röst efter att valet har avslutats.
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
  ))
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
  }))

  const { classes } = useStyles()
  const [displayIndex, setDisplayIndex] = useState<Map<string, string>>(new Map<string, string>())
  const [hasVoted, setHasVoted] = useState(false)
  const [mayVote, setMayVote] = useState(true)
  const [hash, setHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { authHeader } = useAuthorization()
  const form = useForm({
    initialValues: {
      secret: "",
      ranking: voteOrder.map((c) => c.id)
    },
    validate: {
      secret: (s: string) => (s.length < 10 ? "Secret should be at least 10 characters long" : null)
    }
  })

  const hasOpened = useMemo(() => (
    (election.openTime ? dayjs(Date.now()).isAfter(election.openTime) : false)
  ), [election.openTime])

  const hasClosed = useMemo(() => (
    (election.closeTime ? dayjs(Date.now()).isAfter(election.closeTime) : true)
  ), [election.closeTime])

  const disabled = useMemo(() => (
    hasVoted || election.finalized || !hasOpened || hasClosed || !mayVote
  ), [hasVoted, election.finalized, hasOpened, hasClosed, mayVote])

  const updateDisplayIndex = useCallback((indexes: Map<string, number>) => {
    let firstSymbolic = voteOrder.length
    voteOrder.forEach((candidate) => {
      if (candidate.symbolic) firstSymbolic = Math.min(firstSymbolic, indexes.get(candidate.id) ?? firstSymbolic)
    })
    setDisplayIndex(new Map(voteOrder.map((candidate) => {
      let index = indexes.get(candidate.id) ?? 0
      return [candidate.id, `${firstSymbolic < index ? "-" : index + 1}`]
    })))
  }, [setDisplayIndex, voteOrder])

  const handleItemUpdate = useCallback(({ destination, source }: DropResult) => {
    if (destination == undefined) return;
    const adjustedIndexes = new Map(voteOrder.map((candidate, index) => {
      if (source.index == destination.index) return [candidate.id, index]
      if (index == source.index) return [candidate.id, destination.index]
      return [candidate.id, (source.index < destination.index ?
        index - (index > source.index ? 1 : 0) + (index > destination.index ? 1 : 0) :
        index + (index >= destination.index ? 1 : 0) - (index >= source.index ? 1 : 0)
      )]
    }))
    updateDisplayIndex(adjustedIndexes)
  }, [voteOrder])
  
  const handleItemDrop = useCallback(({ destination, source }: DropResult) => {
    voteOrderHandlers.reorder({
      from: source.index,
      to: destination ? destination.index : source.index
    })
  }, [voteOrderHandlers])

  const submitForm = useCallback(form.onSubmit((values) => {
    axios.post(`/api/election/${election.id}/vote`, values, {
      headers: authHeader
    }).then(({data}) => {
      setHash(data)
      setHasVoted(true)
    }).catch(({response}) => {
      setError(response.data)
    })
  }), [form])


  useEffect(() => {
    axios(`/api/election/${election.id}/has-voted`, {
      headers: authHeader
    }).then(({data}) => {
      setHasVoted(data)
    }).catch(({response}) => {
      setHasVoted(false)
    })
  }, [authHeader])

  useEffect(() => {
    axios(`/api/voter/allowed`, {
      headers: authHeader
    }).then(() => {
      setMayVote(true)
    }).catch(({response}) => {
      if (response.status == 403) 
        setMayVote(false)
    })
  }, [authHeader])

  useEffect(() => {
    form.setFieldValue('ranking', voteOrder.map((c) => c.id))
  }, [voteOrder])

  useEffect(
    () => updateDisplayIndex(new Map(voteOrder.map((candidate, index) => [candidate.id, index]))),
    [voteOrder]
  )

  const items = voteOrder.map((candidate, index) => (
    <DraggableCandidate candidate={candidate} index={index} disabled={disabled} displayIndex={displayIndex}/>
  ))

  return <div>
    <div>
      <p>{election.description}</p>
    </div>

    {election.openTime && election.closeTime &&
      <Grid my="md">
        <Grid.Col md={6}>
          <p style={{ textAlign: "left" }}>
            <b>Valet öppnar</b> <br/>
            {election.openTime.toLocaleString()}
          </p>
        </Grid.Col>
        <Grid.Col md={6}>
          <p style={{textAlign: "right"}}>
            <b>Valet stänger</b> <br/>
            {election.closeTime.toLocaleString()}
          </p>
        </Grid.Col>
      </Grid>
    }

    <InfoBox />

    {disabled &&
      <div className={classes.votingDisabledInfo}>
        
        {(election.finalized || (hasClosed && hasOpened)) &&
          <p> Det går inte lägre att rösta i det här valet. </p>
        }

        {!mayVote && !hasVoted &&
          <p>
            Du har inte fått rösträtt i det här valet.<br/>
            Kontakta valberedningen om du är medlem och ska ha det.<br/>
            (<a href="mailto:valberedningen@datasektionen.se">valberedningen@datasektionen.se</a>) 
            
          </p>
        }

        {!election.finalized && !hasOpened && mayVote &&
          <p>Det här valet har inte öppnat ännu</p>
        }

        {!(election.finalized || hasClosed || !hasOpened) && hasVoted &&
          <p>Du har redan röstat i det här valet. </p>
        }
      </div>
    }

    <form onSubmit={submitForm}>

      <div className={classes.flexRow} style={{marginBottom:"1rem"}}>
        <div className={classes.flexSubRow}>
          <p style={{marginTop: "0.6rem"}}>Secret: </p>
          <TextInput disabled={disabled} placeholder="Secret" {...form.getInputProps('secret')} />
        </div>
        <Button disabled={disabled} type="submit">
          Rösta
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
    </form>

    {hash && <InformationModal opened={!!hash} onClose={() => setHash(null)} info={
      <p>Din röst är registrerad och fick hashen:<br /> 
      <code>{hash}</code><br />
      Den kan användas för att verifiera att din röst efter valet.</p>
    } />}
    {error && <ErrorModal opened={!!error} onClose={() => setError(null)} error={
      "Misslyckades skicka rösten till databasen, kontakta IOR"
    } />}

  </div>
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
          transform = transform.replace(/\(.+\,/, "(0,");
        }
        const style = {
          ...provided.draggableProps.style,
          transform,
        };

        return <div
          className={cx(classes.item, { [classes.itemDragging]: snapshot.isDragging }, { [classes.disabled]: disabled })}
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