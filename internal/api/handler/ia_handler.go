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
