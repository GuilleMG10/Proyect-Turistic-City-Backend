package api

import "github.com/gin-gonic/gin"

type UserHandler interface {
	GetUser(c *gin.Context)
	CreateUser(c *gin.Context)
}

func RegisterRoutes(router *gin.Engine, u UserHandler) {
	router.GET("/users/:id", u.GetUser)
	router.POST("/users", u.CreateUser)
}
