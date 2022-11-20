import React, {useState} from "react"

import { Modal, Button, Center, Text, Container, createStyles } from "@mantine/core"

import { InformationModal } from "../../components/PopupModals"
import useAuthorization from "../../hooks/useAuthorization"
import axios from "axios"


const useStyles = createStyles((theme) => ({
  container: {
    background: theme.colors.gray[1],
    borderRadius: "0.3rem",
    padding: "10rem"
  }
}))

const AdminActions: React.FC = () => {
  const [nukeReadied, setReadied] = useState(false)
  const [success, setSuccess] = useState(false)
  const { authHeader } = useAuthorization()
  const { classes } = useStyles()

  const nuke = () => {
    axios.delete("/api/elections/nuke", {
      headers: authHeader
    }).then(() => {
      setReadied(false)
    }).catch(() => {})
  } 

  return <>
    <Modal centered title={<Text> Rensa val</Text>}
      opened={nukeReadied} onClose={()=>setReadied(false)}>
      <Center>
        <p>Är du säker på att du vill rensa alla val? Detta ska endast göras när alla valen är avslutade, och röstsiffrorna inte längre behövs.</p>
      </Center>
      <Center>
        <Button onClick={nuke} color={"red"}>
          Rensa
        </Button>
      </Center>
    </Modal>

    <InformationModal opened={success} onClose={()=>setSuccess(false)} info={
      "rensning lyckades"
    }/>
    <Container my="md">
      <div className={classes.container}>

        <Center>
          <Button onClick={()=>setReadied(true)} color={"red"}>
            Rensa alla val
          </Button>
        </Center>
      </div>
    </Container>
  </>
}

export default AdminActions