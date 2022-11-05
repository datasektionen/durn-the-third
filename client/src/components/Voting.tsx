import React, { useCallback, useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { Selector } from 'tabler-icons-react'
import axios from "axios";

import { useForm } from "@mantine/form"
import { useListState } from "@mantine/hooks";
import { Button, createStyles, Input, TextInput } from "@mantine/core";

import { Election, electionMock } from "./Election";
import useAuthorization from "../hooks/useAuthorization";
import constants from "../util/constants";
import { compareList } from "../util/funcs";

interface candidateInfo {
  id: string,
  index: string,
  name: string,
  presentation: string, 
  symbolic: boolean
}

const useStyle = createStyles((theme) => ({

  item: {
    // ...theme.fn.focusStyles(),
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

  box : {
    border: `1px solid ${theme.colors.gray[5]}`,
    borderRadius: "0.5rem",
    paddingLeft: "1rem",
    paddingRight: "1rem",
    paddingTop: "0.4rem",
    paddingBottom: "0.4rem",

  description : {

  },

  info : {
    padding: "1rem",
    marginBottom: "1rem",
    borderRadius: "0.5rem",
    backgroundColor: "rgb(197, 202, 233)",
  }

}));

const InfoBox: React.FC = () => {

  const { classes, cx } = useStyle()

  return <div className={cx(constants.themeColor, "lighten-4", classes.info)}>
    <p>
      Rangordna kandidater i den ordningen som du föredrar dem. Om du lägger <strong>Blank</strong> eller <strong>Vakant</strong> ovanför en kandidat betyder det att du hellre vill rösta blankt 
      eller vakanssätta posten än att den kandidaten blir vald. Allt som ligger under Blank eller Vakant spelar ordningen ingen roll på.
      <br /><br />
      <strong>Secret</strong> ska innehålla en minst 10 karaktärer lång sträng som kan användas för att varifiera att din röst registrerats i systemet efter att rösterna räknats.
    </p>
  </div>
}

export const Voting: React.FC<{election: Election}> = (props) => {
  const keys = new Map (props.election.candidates.map((candidate)=>
    [candidate.id, [(candidate.symbolic ? 1 : 0), Math.random()]]
  ))
  const [voteOrder, voteOrderHandlers] = useListState<candidateInfo>(props.election.candidates.map(
    (candidate, index) => {return {
      id: candidate.id,
      index: `${index}`,
      name: candidate.name,
      presentation: candidate.presentation,
      symbolic: candidate.symbolic
    }}
  ).sort((a: candidateInfo, b: candidateInfo) => {
    const aKey = keys.get(a.id) || [1, 1]
    const bKey = keys.get(b.id) || [1, 1]
    return compareList(aKey, bKey)
  }))

  const [disabled, setDisabled] = useState(true)
  const [hash, setHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { authHeader } = useAuthorization()
  const { classes, cx } = useStyle()
  const form = useForm({
    initialValues: {
      secret: "",
      ranking: voteOrder.map((c) => c.id)
    },
    validate: {
      secret: (s: string) => (s.length < 10 ? "Secret should be at least 10 characters long" : null)
    }
  })

  useEffect(() => {
    // let hasVoted = false
    axios(`/api/election/${props.election.id}/has-voted`, {
      headers: authHeader
    }).then((res) => {
      setDisabled(res.data == "true")
    }).catch((reason) => {
      console.log(reason.body)
    })
  }, [authHeader])

  const items = voteOrder.map((candidate, index) =>
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
          className={cx(classes.item, {[classes.itemDragging]: snapshot.isDragging}, {[classes.disabled]: disabled})}
          {...provided.draggableProps}
          ref={provided.innerRef}
          style={style}
        >
          <div className={classes.flexRow}>
            <div className={classes.flexSubRow}>
              <div {...provided.dragHandleProps} className={classes.dragHandle}>
                <Selector size={18} strokeWidth={2} color={'black'} />
              </div>
              <div className={classes.box}> <span> {candidate.index} </span> </div>
              <div> <span> {candidate.name} </span> </div>
            </div>
            {candidate.presentation != "" ?
              <div style={{ whiteSpace: "nowrap", marginLeft:"0.5rem"}}> <span>
                <a href={candidate.presentation} target="_blank"> Presentation </a>
              </span> </div> : <></>}
          </div>
        </div>
      }}
    </Draggable>
  )

  // Update result ordering
  useEffect(() => {
    form.setFieldValue('ranking', voteOrder.map((c) => c.id))
  },[voteOrder])

  const updateIndexes = useCallback(()=> {
    let firstSymbolic = voteOrder.length
    voteOrderHandlers.apply((candidate, index) => {
      if (candidate.symbolic && index !== undefined)
        firstSymbolic = Math.min(firstSymbolic, index)
      return candidate
    })
    voteOrderHandlers.apply((candidate, index) => {
      index = index || 0
      candidate.index = `${firstSymbolic < index ? "-" : index + 1}`
      return candidate
    })
  }, [voteOrderHandlers])

  const handleItemDrop = useCallback(({ destination, source }: DropResult) => {
    voteOrderHandlers.reorder({
      from: source.index,
      to: destination ? destination.index : source.index
    })
    updateIndexes()
  }, [voteOrderHandlers])

  const submitForm = useCallback(form.onSubmit((values) => {
    console.log(values)
    axios.post(`/api/election/${props.election.id}/vote`, values, {
      headers: authHeader
    }).then((res) => {
      setHash(res.data)
      console.log(res.data)
      setDisabled(true)
    }).catch((reason) => {
      setError(reason.message)
      console.log(reason.message)
    })
  }), [form])

  useEffect(() => updateIndexes(), [])
  return <div>
    <div className={classes.description}>
      <p>{props.election.description}</p>
    </div>

    <InfoBox />

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

      <DragDropContext onDragEnd={handleItemDrop} >
        <Droppable droppableId="vote-ordering" direction="vertical">
          {(provided) => <div {...provided.droppableProps} ref={provided.innerRef} className={classes.droppable}>
            {items}
            {provided.placeholder}
          </div>}
        </Droppable>
      </DragDropContext>
    </form>

  </div>
}
