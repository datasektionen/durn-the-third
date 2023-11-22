package util

import (
	"crypto/sha512"
	"encoding/hex"

	uuid "github.com/satori/go.uuid"
)

func GetVoteHash(userId string, electionId uuid.UUID) string {
	hashId := append(
		electionId[:],
		[]byte(":"+userId)...,
	)
	shaDigest := sha512.Sum512(hashId)
	hsh := hex.EncodeToString(shaDigest[:])
	return hsh
}
