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

type IAHandler struct {
	userService IAUserService
}

func NewIAHandler(userService IAUserService) *IAHandler {
	return &IAHandler{userService: userService}
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
		Prompt     string `json:"prompt"`
		Model      string `json:"model"`      // "fast" or "thinking"
		SkipMemory bool   `json:"skipMemory"` // Skip memory for itinerary requests
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

	// 4. Forward to Node.js AI service (provider is determined by AI_PROVIDER env var in Node.js)
	nodeBackendURL := "http://localhost:3500/ia/prompt"
	payload, err := json.Marshal(map[string]interface{}{
		"prompt":     requestBody.Prompt,
		"userId":     userID,
		"interests":  interests,
		"model":      requestBody.Model,
		"skipMemory": requestBody.SkipMemory,
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

// GenerateItinerary forwards the itinerary generation request to the Node.js AI service
func (h *IAHandler) GenerateItinerary(c *gin.Context) {
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

	// 2. Parse the request body (pass through to Node.js)
	var requestBody map[string]interface{}
	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cuerpo de la petición inválido"})
		return
	}

	// 3. Fetch user interests from the database to enrich the request
	interests, err := h.userService.GetUserInterests(userID)
	if err != nil {
		log.Printf("Could not retrieve interests for user %d: %v. Proceeding without them.", userID, err)
		interests = []*model.Event{}
	}

	// 4. Add user context to the request
	requestBody["userId"] = userID
	if requestBody["interests"] == nil {
		requestBody["interests"] = interests
	}

	// 5. Forward to Node.js AI service
	nodeBackendURL := "http://localhost:3500/ia/itinerary"
	payload, err := json.Marshal(requestBody)
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

// GenerateVision forwards the vision request to the Node.js AI service
func (h *IAHandler) GenerateVision(c *gin.Context) {
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

	// 2. Parse the request body
	var requestBody map[string]interface{}
	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cuerpo de la petición inválido"})
		return
	}

	// 3. Add user context to the request
	requestBody["userId"] = userID

	// 4. Forward to Node.js AI service
	nodeBackendURL := "http://localhost:3500/ia/vision"
	payload, err := json.Marshal(requestBody)
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

	visionReader := bufio.NewReader(resp.Body)
	for {
		line, err := visionReader.ReadBytes('\n')
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

func (h *IAHandler) GetCapabilities(c *gin.Context) {
	nodeBackendURL := "http://localhost:3500/ia/capabilities"

	resp, err := http.Get(nodeBackendURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error connecting to AI backend"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		c.JSON(resp.StatusCode, gin.H{"error": "AI backend error"})
		return
	}

	var capabilities map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&capabilities); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error parsing capabilities"})
		return
	}

	c.JSON(http.StatusOK, capabilities)
}
