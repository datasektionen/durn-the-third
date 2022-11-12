import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "methone"

import { Checkbox, createStyles, Grid, ScrollArea, Table, Container, Skeleton, Button, Textarea } from "@mantine/core";

import useAuthorization from "../../hooks/useAuthorization";
import useMap from "../../hooks/useMap";

const useStyles = createStyles((theme) => { return {
  tableContainer: {
    // border: `solid 1px ${theme.colors.gray[6]}`
  },
  sectionTitle: {
    textAlign: "center",
  }
}})

const EditVoters: React.FC = () => {
  const {adminRead, adminWrite, authHeader} = useAuthorization()
  const navigate = useNavigate()
  const [voters, setVoters] = useState<string[]>([])

  useEffect(() => {
    console.log(authHeader)
    axios("/api/voters", {
      headers: authHeader
    }).then((res) => {
      setVoters(res.data.voters)
    }).catch((error) => {
      console.log(error)
    })

  }, [authHeader])

  if (!adminRead) navigate("/", {replace: true})

  return <> { adminRead && <>
    <Header title="Administrera väljare" />
    <div> { adminRead &&
      <Container my="md">
        <Grid>
          <Grid.Col>
            <Info />
          </Grid.Col>

          <Grid.Col xs={6}>
            <AddVotersField disabled={!adminWrite} setVoters={setVoters}/>
          </Grid.Col>

          <Grid.Col xs={6}>
            <VotersTable voters={voters} setVoters={setVoters} />
          </Grid.Col>
        </Grid>
      </Container>
    } </div>
  </>} </>
}


const Info: React.FC = () => {
  return <Skeleton height={300} animate={false} />
}

interface AddVotersFieldProps {
  disabled: boolean,
  setVoters: (voters: string[]) => void
}

const AddVotersField: React.FC<AddVotersFieldProps> = ({disabled, setVoters}) => {
  const { classes, cx } = useStyles()
  const { authHeader } = useAuthorization()
  const ref = useRef<HTMLTextAreaElement>(null)

  const addVoters = (voters: string[]) => {
    axios.put("/api/voters/add",{
      voters: voters
    }, {
      headers: authHeader
    }).then((res) => {
      setVoters(res.data.voters)
    }).catch((err) => {
      console.log(err.message)
    })
  }

  const handleButtonClick = () => {
    const input = ref.current?.value ?? ""
    const values = input.split(/\s*[\n,]\s*/)
    addVoters(values)
  }

  return <div>
    <h3 className={classes.sectionTitle}>
      Add voters
    </h3>
    <Button onClick={handleButtonClick}>Submit</Button>
    <div style={{marginTop: "1rem"}}>
      <Textarea autosize ref={ref} />
    </div>
  </div>
}

interface VotersTableProps {
  voters: string[]
  setVoters: (voters: string[]) => void
}

const VotersTable: React.FC<VotersTableProps> = ({voters, setVoters}) => {
  const { authHeader } = useAuthorization()
  const { classes, cx } = useStyles()
  const [selection, selectionActions] = useMap<string, boolean>()

  const toggleVoter = (voter: string) => {
    if (selection.has(voter)) {
      selectionActions.remove(voter)
    } else {
      selectionActions.set(voter, true)
    }
  }

  const toggleAll = () => {
    if (selection.size > 0) {
      selectionActions.reset()
    } else {
      selectionActions.setList(voters, true)
    }
  }

  const deleteVoters = () => {
    if (selection.size == 0) return
    const removedVoters = Array.from(selection.keys())
    console.log(removedVoters)

    axios.delete("/api/voters/remove", {
      headers: authHeader,
      data: {
        voters: removedVoters
      }
    }).then((res) => {
      setVoters(res.data.voters)
      selectionActions.reset()
    }).catch((err) => {
      console.log(err)
    })
  }

  const rows = voters.map((voter) => (
    <tr key={voter}>
      <td>
        <Checkbox
          checked={selection.has(voter)}
          onChange={() => toggleVoter(voter)}
        />
      </td>
      <td>
        {voter}
      </td>
    </tr>
  ))

  return <div className={classes.tableContainer}>
    <h3 className={classes.sectionTitle}>
      Allowed voters
    </h3>
    <ScrollArea>
      <Table withColumnBorders withBorder>
        <thead>
          <tr>
            <th style={{ width: 40 }}>
              <Checkbox 
                onChange={toggleAll}
                size="sm"
                checked={selection.size == voters.length}
                indeterminate={selection.size > 0 && selection.size < voters.length}
              />
            </th>
            <th>
              <Button compact onClick={deleteVoters}>
                Delete selected Users
              </Button>
            </th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </Table>
    </ScrollArea>
  </div>
}


export default EditVoters