import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "methone"

import { Checkbox, createStyles, Grid, ScrollArea, Table, Container, Skeleton, Button, Textarea } from "@mantine/core";

import useAuthorization from "../../hooks/useAuthorization";
import useMap from "../../hooks/useMap";
import constants from "../../util/constants";
import { env } from "../../util/env";

const useStyles = createStyles((theme) => { return {
  tableContainer: {
    // border: `solid 1px ${theme.colors.gray[6]}`
  },
  sectionTitle: {
    textAlign: "center",
  },

  info: {
    padding: "3rem",
    marginBottom: "1rem",
    borderRadius: "0.5rem",
    backgroundColor: "rgb(197, 202, 233)",
  },
}})

const EditVoters: React.FC = () => {
  const {adminRead, adminWrite, authHeader} = useAuthorization()
  const navigate = useNavigate()
  const [voters, setVoters] = useState<string[]>([])

  useEffect(() => {
    axios(`${env.API_URL}/api/voters`, {
      headers: authHeader
    }).then((res) => {
      setVoters(res.data.voters)
    }).catch(() => {})
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
  const { classes, cx } = useStyles()
  return <div className={cx(constants.themeColor, "lighten-4", classes.info)}>
    I den här menyn administreras vilka som har rösträtt.<br /><br />
    
    Vid systemets utvecklingstillfälle så går det endast att få ut vilka medlemmar vi har genom att få ett spreadsheet av THS.
    Detta behöver föras över till systemet, och detta är menat att göras genom att kopiera över kolumnen med <strong>mailaddresser </strong> 
    till fältet för att lägga till röstberättigade. <br /><br />

    Enstaka användare kan läggas till och tas bort. Om en användare som redan existerar läggs till så händer inget. D.v.s. när en lista av 
    användare läggs till filtreras alla som redan är röstberättigade bort, så att inga dubbletter skapas.
    Allt som inte är en mailaddress på formen <code>[...]@kth.se</code> filtreras också bort. 
  </div>
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
    axios.put(`${env.API_URL}/api/voters/add`,{
      voters: voters
    }, {
      headers: authHeader
    }).then((res) => {
      setVoters(res.data.voters)
    }).catch((err) => { })
  }

  const handleButtonClick = () => {
    const input = ref.current?.value ?? ""
    const values = input.split(/\s*[\n,]\s*/).map((v) => v.trim())
    addVoters(values)
  }

  return <div>
    <h3 className={classes.sectionTitle}>
      Lägg till röstberättigade
    </h3>
    <Button onClick={handleButtonClick} fullWidth>
      Spara
    </Button>
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

    axios.delete(`${env.API_URL}/api/voters/remove`, {
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
      Alla röstberättigade
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
                Ta bort valda användare
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