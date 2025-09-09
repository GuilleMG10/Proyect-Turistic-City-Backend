package api

import "github.com/gin-gonic/gin"

type UserHandler interface {
	GetUser(c *gin.Context)
	CreateUser(c *gin.Context)
}

type IAHandler interface {
	GenerateAIResponse(c *gin.Context)
}

func RegisterRoutes(router *gin.Engine, u UserHandler, ia IAHandler) {
	router.GET("/users/:id", u.GetUser)
	router.POST("/users", u.CreateUser)
	router.POST("/ia", ia.GenerateAIResponse)
}
