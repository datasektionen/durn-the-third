package middleware

import (
	"context"
	"crypto/rand"
	"durn/config"
	"encoding/base64"
	"fmt"
	"io"
	"log"
	"net/http"
	"slices"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	// "github.com/go-playground/locales/ses"
)

type Permission struct {
	Id    string
	Scope string
}

var (
	loaded       bool = false
	oauth2Config oauth2.Config
	verifier     *oidc.IDTokenVerifier
)

func InitOIDC(ctx context.Context) {
	c := config.GetConfig()
	provider, err := oidc.NewProvider(ctx, c.OIDC_PROVIDER)
	if err != nil {
		log.Panicln(err.Error())
		panic(err.Error())
	}

	// Configure an OpenID Connect aware OAuth2 client.
	oauth2Config = oauth2.Config{
		ClientID:     c.OIDC_CLIENT_ID,
		ClientSecret: c.OIDC_CLIENT_SECRET,
		RedirectURL:  c.OIDC_REDIRECT_URL,

		// Discovery returns the OAuth2 endpoints.
		Endpoint: provider.Endpoint(),

		// "openid" is a required scope for OpenID Connect flows.
		Scopes: []string{oidc.ScopeOpenID, "profile", "email", "permissions"},
	}
	verifier = provider.Verifier(&oidc.Config{ClientID: c.OIDC_CLIENT_ID})

	loaded = true
}

func RandString(nByte int) (string, error) {
	b := make([]byte, nByte)
	if _, err := io.ReadFull(rand.Reader, b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		session := sessions.Default(c)

		if !loaded {
			InitOIDC(c)
		}

		if session.Get("userid") == nil {
			state, err := RandString(16)
			if err != nil {
				c.String(http.StatusInternalServerError, "failed to generate state")
				c.Abort()
			}
			c.SetCookie("state", state, 3600, "/", "localhost", false, true)

			c.Abort()
			c.Redirect(http.StatusTemporaryRedirect, oauth2Config.AuthCodeURL(state))
			return
		}

		c.Set("user", session.Get("user"))
		c.Set("userid", session.Get("userid"))
		c.Set("perms", session.Get("perms"))

		c.Next()
	}
}

func SiletAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		session := sessions.Default(c)

		if !loaded {
			InitOIDC(c)
		}

		if session.Get("userid") != nil {
			c.Set("user", session.Get("user"))
			c.Set("userid", session.Get("userid"))
			c.Set("perms", session.Get("perms"))
		} else {
			fmt.Println("userid does not exist in session")
		}

		c.Next()
	}
}

func HandleOAuth2(c *gin.Context) {
	if !loaded {
		InitOIDC(c)
	}
	s := sessions.Default(c)

	// Verify state and errors.
	state, err := c.Cookie("state")
	if err != nil {
		c.String(http.StatusBadRequest, "state not found")
		c.Abort()
		return
	}

	if c.Query("state") != state {
		c.String(http.StatusBadRequest, "state did not match")
		c.Abort()
		return
	}

	oauth2Token, err := oauth2Config.Exchange(c, c.Query("code"))
	if err != nil {
		c.String(http.StatusBadRequest, "failed to exchange code")
		c.Abort()
		return
	}

	// Extract the ID Token from OAuth2 token.
	rawIDToken, ok := oauth2Token.Extra("id_token").(string)
	if !ok {
		c.String(http.StatusBadRequest, "No id token")
		c.Abort()
		return
	}

	// Parse and verify ID Token payload.
	idToken, err := verifier.Verify(c, rawIDToken)
	if err != nil {
		c.String(http.StatusBadRequest, "Failed to verify id token")
		c.Abort()
		return
	}

	var claims struct {
		Email       string       `json:"email"`
		Permissions []Permission `json:"permissions"`
	}
	if err := idToken.Claims(&claims); err != nil {
		c.String(http.StatusBadRequest, "Failed to extract claims")
		c.Abort()
		return
	}

	// we only care about PermIds, since all our perms are unscoped
	perms := make([]string, len(claims.Permissions))
	for i, v := range claims.Permissions {
		perms[i] = v.Id
	}

	s.Set("user", fmt.Sprintf("%s@kth.se", idToken.Subject))
	s.Set("userid", idToken.Subject)
	s.Set("perms", perms)
	s.Save()

	c.Redirect(http.StatusTemporaryRedirect, "/")
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
		if slices.Contains(perms, perm) {

			c.Next()
			return
		}
		c.String(http.StatusForbidden, "Insufficient permissions")
		c.Abort()
	}
}
