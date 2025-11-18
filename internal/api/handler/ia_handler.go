package handler

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/GuilleMG10/Proyect-Turistic-City-Backend/internal/model"
	"github.com/gin-gonic/gin"
)

type IAUserService interface {
	GetUserInterests(userID uint) ([]*model.Event, error)
}

// Nueva interfaz para desacoplar el servicio de favoritos
type PlaceFavoriteService_IA interface {
	GetUserFavorites(userID int) ([]model.PlaceFavorite, error)
}

type IAHandler struct {
	userService          IAUserService
	placeFavoriteService PlaceFavoriteService_IA // Añadido
}

func NewIAHandler(userService IAUserService, placeFavoriteService PlaceFavoriteService_IA) *IAHandler { // Modificado
	return &IAHandler{
		userService:          userService,
		placeFavoriteService: placeFavoriteService, // Añadido
	}
}

func (h *IAHandler) GenerateAIResponse(c *gin.Context) {
	// 1. Get UserID from JWT context (set by AuthMiddleware)
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID not found in context"})
		return
	}
	userID, ok := userIDVal.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID in context has invalid format"})
		return
	}

	// 2. Get prompt from request body
	var requestBody struct {
		Prompt string `json:"prompt"`
	}
	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cuerpo de la petición inválido, se requiere 'prompt'"})
		return
	}

	// 3. Fetch user interests from the database
	interests, err := h.userService.GetUserInterests(userID)
	if err != nil {
		log.Printf("Could not retrieve interests for user %d: %v. Proceeding without them.", userID, err)
		interests = []*model.Event{}
	}
	// 4. Forward to Node.js AI service
	nodeBackendURL := "http://localhost:3000/ia/prompt"
	payload, err := json.Marshal(map[string]interface{}{
		"prompt":    requestBody.Prompt,
		"userId":    userID,
		"interests": interests,
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear el cuerpo de la petición"})
		return
	}

	req, err := http.NewRequest("POST", nodeBackendURL, bytes.NewBuffer(payload))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear la petición a Node.js"})
		return
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al conectar con el backend de IA"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		c.JSON(resp.StatusCode, gin.H{"error": fmt.Sprintf("Error del backend de Node.js: %s", string(bodyBytes))})
		return
	}

	// 5. Stream the response back to the client
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("Transfer-Encoding", "chunked")

	reader := bufio.NewReader(resp.Body)
	for {
		line, err := reader.ReadBytes('\n')
		if err != nil {
			if err == io.EOF {
				break
			}
			break
		}
		c.Writer.Write(line)
		c.Writer.Flush()
	}
}

// NUEVO ENDPOINT
func (h *IAHandler) GenerateItinerary(c *gin.Context) {
	// 1. Get UserID from JWT context
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID not found in context"})
		return
	}
	userID, ok := userIDVal.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User ID in context has invalid format"})
		return
	}

	// 2. Bind frontend request body
	var feRequest struct {
		Date        string   `json:"date"`
		StartTime   string   `json:"start_time"`
		EndTime     string   `json:"end_time"`
		Budget      float64  `json:"budget"`
		Preferences []string `json:"preferences"`
		Pace        string   `json:"pace"`
	}
	if err := c.ShouldBindJSON(&feRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cuerpo de la petición inválido"})
		return
	}

	// 3. Build context for AI
	type aiNameObject struct {
		Name string `json:"name"`
	}
	aiInterests := make([]aiNameObject, 0)

	// 3a. Add preferences from form
	for _, pref := range feRequest.Preferences {
		aiInterests = append(aiInterests, aiNameObject{Name: pref})
	}

	// 3b. Add user's favorite events
	eventInterests, err := h.userService.GetUserInterests(userID)
	if err == nil {
		for _, event := range eventInterests {
			aiInterests = append(aiInterests, aiNameObject{Name: event.Name})
		}
	}

	// 3c. Add user's favorite places
	placeFavorites, err := h.placeFavoriteService.GetUserFavorites(int(userID))
	if err == nil {
		for _, fav := range placeFavorites {
			if fav.Place.ID != 0 { // Asegurarse que el Place fue precargado
				aiInterests = append(aiInterests, aiNameObject{Name: fav.Place.Name})
			}
		}
	}

	// 4. Build payload for Node.js AI service
	schedule := fmt.Sprintf("Desde %s hasta %s el %s", feRequest.StartTime, feRequest.EndTime, feRequest.Date)
	maxItinerarySize := 5 // Default
	if feRequest.Pace == "intense" {
		maxItinerarySize = 8
	} else if feRequest.Pace == "relaxed" {
		maxItinerarySize = 3
	}

	aiPayload := map[string]interface{}{
		"nearbyPlaces":          []aiNameObject{}, // El modal no recoge esto
		"interests":             aiInterests,      // Combinación de preferencias y favoritos
		"placesAlreadySelected": []aiNameObject{}, // El modal no recoge esto
		"budget":                feRequest.Budget,
		"scheduleAvailability":  schedule,
		"maximumItinerarySize":  maxItinerarySize,
	}

	payloadBytes, err := json.Marshal(aiPayload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear el payload para IA"})
		return
	}

	// 5. Forward to Node.js AI service (NUEVO endpoint /ia/itinerary)
	nodeBackendURL := "http://localhost:3000/ia/itinerary"
	req, err := http.NewRequest("POST", nodeBackendURL, bytes.NewBuffer(payloadBytes))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al crear la petición a Node.js"})
		return
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al conectar con el backend de IA"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		c.JSON(resp.StatusCode, gin.H{"error": fmt.Sprintf("Error del backend de Node.js: %s", string(bodyBytes))})
		return
	}

	// 6. Stream the response back to the client
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("Transfer-Encoding", "chunked")

	reader := bufio.NewReader(resp.Body)
	for {
		line, err := reader.ReadBytes('\n')
		if err != nil {
			if err == io.EOF {
				break
			}
			break
		}
		c.Writer.Write(line)
		c.Writer.Flush()
	}
}
