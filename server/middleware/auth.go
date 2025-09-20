package middleware

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"durn/config"
	"durn/server/util"

	"github.com/gin-gonic/gin"
)

type loginResponse struct {
	Email     string `json:"emails" Usage:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Ugkthid   string `json:"ugkthid"`
	User      string `json:"user"`
}

func Authenticate() gin.HandlerFunc {
	conf := config.GetConfig()
	url := conf.LOGIN_URL
	key := conf.LOGIN_KEY

	if check, err := http.Get(url + "/hello"); err != nil || check.StatusCode != 200 {
		fmt.Println(err)
		os.Exit(5)
	}

	return func(c *gin.Context) {
		authHeader := strings.Split(c.GetHeader("Authorization"), " ")
		if len(authHeader) < 2 {
			c.String(http.StatusUnauthorized, "Invalid Authorization header provided") // Unauthorized = Unauthenticated in http
			c.Abort()
			return
		}
		token := authHeader[1]
		requestURL := fmt.Sprintf("%s/verify/%s?api_key=%s", url, token, key)

		var response loginResponse
		if err := util.GetValidatedJsonFromURL(requestURL, &response, ""); err != nil {
			// TODO: proper logging
			c.String(http.StatusUnauthorized, "Not logged in") // Unauthorized = Unauthenticated in http
			c.Abort()
			return
		}

		c.Set("user", response.Email)
		c.Set("userid", response.User)

		c.Next()
	}
}

type hivePermission struct {
	PermId string `json:"perm_id"`
	Scope  string `json:"scope"`
}

func Authorize() gin.HandlerFunc {
	conf := config.GetConfig()
	url := conf.HIVE_URL
	token := conf.HIVE_API_KEY

	if check, err := http.Get(url + "/"); err != nil || check.StatusCode != 200 {
		fmt.Println(err)
		os.Exit(5)
	}

	return func(c *gin.Context) {
		user := c.GetString("userid")
		requestURL := fmt.Sprintf("%s/api/v1/user/%s/permissions", url, user)

		var response []hivePermission

		if err := util.GetValidatedJsonFromURL(requestURL, &response, token); err != nil {
			// TODO: PROPER LOGGING
			fmt.Println("AUTHORIZATION FAILED")
			response = []hivePermission{}
		}

		// we only care about PermIds, since all our perms are unscoped
		perms := make([]string, len(response))
		for i, v := range response {
			perms[i] = v.PermId
		}

		c.Set("perms", perms)
		c.Next()
	}
}

// Checks if the logged in user has the provided permission in Hive;
// assumes Authentication and Authorization has been done
func HasPerm(perm string) gin.HandlerFunc {
	return func(c *gin.Context) {
		perms, ok := c.Keys["perms"].([]string)
		if !ok {
			fmt.Print("error")
			return
		}
		for _, val := range perms {
			if val == perm {
				c.Next()
				return
			}
		}
		c.String(http.StatusForbidden, "Insufficient permissions")
		c.Abort()
	}
}

func Auth() gin.HandlersChain {
	return gin.HandlersChain{Authenticate(), Authorize()}
}
