package util

const (
	BadUUID         = "Malformed UUID specified"
	BadParameters   = "Malformed or missing parameters in body"
	InvalidElection = "Invalid election specified"
	RequestFailed   = "Server failed to handle request"
)

func TryParseUuidInPath(c *gin.Context) (uuid.UUID, bool) {
	id, err := uuid.FromString(c.Param("id"))
	if err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, "400 Bad Request: Malformed UUID specified")
		return id, false
	}
	return id, true
}

func TryParseJsonBody[T interface{}](c *gin.Context, body *T) bool {
	if err := c.BindJSON(&body); err != nil {
		fmt.Println(err)
		c.String(http.StatusBadRequest, "400 Bad Request: Malformed or missing parameters in body")
		return false
	}
	return true
}
