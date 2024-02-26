# smUrn - Digitala omröstningar

This is a implementation of another voting system for the Computer Science Chapter, with a backend written in golang and a frontend written in Typescript React.




# pls Permissions

The system uses the following permissions in pls:

| permission | access |
|----|-----|
| `admin-read` | Allows viewing data associated with elections and voters |
| `admin-write` | Allows modifying and creating elections and voters |


# Development

## Environment variables

| name | default | description |
| ---- | ------- | ----------- |
| `POST` | `3000` | specifies the port that the system will run on |
| `LOGIN_URL` | `https://login.datasektionen.se` | url for the login system and API |
| `LOGIN_KEY` | | API-key for the login system |
| `PLS_URL` | `https://pls.datasektionen.se` | url for the permissions system pls |
| `PLS_SYSTEM_NAME` | `durn` | the system to check for permissions in pls |
| `DATABASE_URL` | | postgres-url for connecting to the database instance |


## How to run

### development

1. Create a postgres database and make sure it is running
2. Set up environment variables
3. Run `make init` in root
4. Run `make run-server` in root
5. In a separate terminal, run `make run-client` in root

### production

1. Create a postgres database and make sure it is running
2. Setup environment variables
3. Run `make prod` in root

The system also has a `dockerfile` setup for deployment.
