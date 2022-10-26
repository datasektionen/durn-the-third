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
		token := strings.Split(c.GetHeader("Authorization"), " ")[1]
		requestURL := fmt.Sprintf("%s/verify/%s?api_key=%s", url, token, key)

		var response loginResponse
		if err := util.GetValidatedJsonFromURL(requestURL, &response); err != nil {
			// TODO: proper logging
			fmt.Println(err)
			c.String(http.StatusUnauthorized, "Not logged in") // Unauthorized = Unauthenticated in http
			c.Abort()
			return
		}

		c.Set("user", response.User)

		c.Next()
	}
}

func Authorize() gin.HandlerFunc {
	conf := config.GetConfig()
	url := conf.PLS_URL

	if check, err := http.Get(url + "/"); err != nil || check.StatusCode != 200 {
		fmt.Println(err)
		os.Exit(5)
	}

	return func(c *gin.Context) {
		user := c.GetString("user")
		requestURL := fmt.Sprintf("%s/api/user/%s/durn", url, user)

		var response []string

		if err := util.GetJsonFromURL(requestURL, &response); err != nil {
			// TODO: PROPER LOGGING
			fmt.Println("AUTHORIZATION FAILED")
			response = []string{}
		}

		c.Set("perms", response)
		c.Next()
	}
}

// Checks if the logged in user has the provided permission in pls
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
	}
}

func Auth() gin.HandlersChain {
	return gin.HandlersChain{Authenticate(), Authorize()}
}
