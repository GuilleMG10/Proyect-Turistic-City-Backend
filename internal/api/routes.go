package api

import "github.com/gin-gonic/gin"

type UserHandler interface {
	GetAllUsers(c *gin.Context)
}

func RegisterRoutes(router *gin.Engine, u UserHandler) {
	router.GET("/users", u.GetAllUsers)
}
