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

  itemDragging: {
    boxShadow: theme.shadows.sm,
  },



export const Voting: React.FC<{election: Election}> = (props) => {
  const [voteOrder, voteOrderHandlers] = useListState<candidateInfo>(props.election.candidates.map(
    (candidate, index) => {return {
      id: candidate.id,
      index: `${index}`,
      name: candidate.name,
      presentation: candidate.presentation,
      symbolic: candidate.symbolic
    }}
  }))

  const { classes, cx } = useStyle()

  const items = voteOrder.map((candidate, index) =>
    <Draggable key={candidate.id} index={index} draggableId={candidate.id} isDragDisabled={disabled}>
      {(provided, snapshot) => {
        return <div
          className={cx(classes.item, {[classes.itemDragging]: snapshot.isDragging}, {[classes.disabled]: disabled})}
          {...provided.draggableProps}
          ref={provided.innerRef}
        >
          <div className={classes.flexRow}>
            <div className={classes.flexSubRow}>
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


  const handleItemDrop = useCallback(({ destination, source }: DropResult) => {
    voteOrderHandlers.reorder({
      from: source.index,
      to: destination ? destination.index : source.index
    })
  }, [voteOrderHandlers])

  return <div>
    <div className={classes.description}>
      <p>{props.election.description}</p>
    </div>

      <DragDropContext onDragEnd={handleItemDrop} >
        <Droppable droppableId="vote-ordering" direction="vertical">
          {(provided) => <div {...provided.droppableProps} ref={provided.innerRef} className={classes.droppable}>
            {items}
            {provided.placeholder}
          </div>}
        </Droppable>
      </DragDropContext>
  </div>
}
