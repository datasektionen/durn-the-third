import axios from "axios";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "methone"

import { Checkbox, createStyles, Grid, ScrollArea, Table, Container, Skeleton, Button, Textarea } from "@mantine/core";

import useAuthorization from "../../hooks/useAuthorization";
import useMap from "../../util/useMap";

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

  // if (!adminRead) {
  //   navigate("/")
  // }

  useEffect(() => {
    axios("/api/voters", {
      headers: authHeader
    }).then((res) => {
      setVoters(res.data.voters)
    }).catch((error) => {
      console.log(error.body)
    })
  }, [authHeader])

  return <>
    <Header title="Manage voters" />
    <div>
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
    </div>
  </>
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
  const rows = voters.map((voter) => (
    <tr key={voter}>
      <td>
        <Checkbox
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
              />
            </th>
            <th>
            </th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </Table>
    </ScrollArea>
  </div>
}


export default EditVoters