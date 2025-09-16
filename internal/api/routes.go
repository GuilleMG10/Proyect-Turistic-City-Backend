package api

import "github.com/gin-gonic/gin"

type UserHandler interface {
	GetUser(c *gin.Context)
	CreateUser(c *gin.Context)
}

type PlaceHandler interface {
	GetPlaces(c *gin.Context)
	AddPlace(c *gin.Context)
}

type ReviewHandler interface {
	GetReviewsByPlace(c *gin.Context)
}

func RegisterRoutes(router *gin.Engine, u UserHandler, p PlaceHandler, r ReviewHandler) {
	router.GET("/users/:id", u.GetUser)
	router.POST("/users", u.CreateUser)

	// Places
	router.GET("/places", p.GetPlaces)
	router.POST("/places", p.AddPlace)

	// Reviews
	router.GET("/places/:id/reviews", r.GetReviewsByPlace)
}
